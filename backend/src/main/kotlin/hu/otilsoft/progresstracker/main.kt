package hu.otilsoft.progresstracker

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import hu.otilsoft.progresstracker.ProjectController.getProjectFile
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Handler
import io.javalin.http.HandlerType
import io.javalin.http.UploadedFile
import io.javalin.http.sse.SseClient
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import java.io.FileInputStream
import java.nio.file.Path
import java.nio.file.Paths
import java.sql.Connection
import java.sql.DriverManager
import kotlin.concurrent.atomics.AtomicBoolean
import kotlin.concurrent.atomics.ExperimentalAtomicApi
import kotlin.io.path.*
import kotlin.use

private val workingDir = Paths.get(System.getProperty("user.dir"))

data class Error(val code: Int, val message: String)

data class Project(val name: String)
data class Category(val id: Int, var name: String)
data class CreateUpdateCategoryDto(val name: String)

data class Item(
    val id: Int,
    val categoryId: Int,
    val name: String,
    val description: String,
    val passed: Boolean,
    val type: String,
    val project: String
)

data class CreateUpdateItemDto(
    val name: String,
    val description: String,
    val passed: Boolean,
    val type: String
)

class EntityAlreadyExistsException(message: String) : Exception(message)
class EntityNotFoundException(message: String) : Exception(message)
class UploadFileMissingException(message: String) : Exception(message)
class UnauthorizedException(message: String) : Exception(message)

object Auth {
    private const val BEARER_PREFIX = "Bearer "

    private val expectedToken: ByteArray = 
        (System.getenv("API_BEARER_TOKEN") ?: throw IllegalStateException("API_BEARER_TOKEN environment variable must be set"))
        .toByteArray(Charsets.UTF_8)

    val bearerToken = Handler { ctx ->
        // CORS preflight requests carry no Authorization header, so let them through.
        if (ctx.method() == HandlerType.OPTIONS) return@Handler

        val header = ctx.header("Authorization")
        val presented: String = when {
            header != null -> {
                if (!header.startsWith(BEARER_PREFIX)) {
                    throw UnauthorizedException("Authorization header must use the Bearer scheme")
                }
                header.substring(BEARER_PREFIX.length).trim()
            }
            // Browsers' EventSource cannot send an Authorization header, so the SSE
            // endpoint accepts the token as a query parameter instead.
            ctx.path().startsWith("/sse/") ->
                ctx.queryParam("token") ?: throw UnauthorizedException("Missing token query parameter")
            else -> throw UnauthorizedException("Missing Authorization header")
        }

        // Constant-time comparison to avoid leaking the token via timing.
        if (!java.security.MessageDigest.isEqual(presented.toByteArray(Charsets.UTF_8), expectedToken)) {
            throw UnauthorizedException("Invalid token")
        }
    }
}

object ConnectionManager {
    fun openConnection(projectFile: Path): Connection {
        return DriverManager.getConnection("jdbc:sqlite:${projectFile}")
    }
}

object ProjectController {
    const val ID_KEY = "project-name"
    private const val EXTENSION = "sqlite"
    private const val PROJECT_NOT_FOUND = "Project not found"
    private const val PROJECT_ALREADY_EXISTS = "Project already exists"

    private val sqlCreateCategoryTable: String = """
        CREATE TABLE IF NOT EXISTS category (
            id   INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    """.trimIndent()

    private val sqlCreateItemTable = """
        CREATE TABLE IF NOT EXISTS item (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            description TEXT,
            passed      BOOLEAN NOT NULL DEFAULT FALSE,
            category_id INTEGER NOT NULL,
            type        STRING NOT NULL,
            FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE,
            UNIQUE (category_id,name)
        )
    """.trimIndent()

    private val workingDir = Paths.get(System.getProperty("user.dir"))
    fun getProjectFile(project: Project): Path = workingDir.resolve("${project.name}.${EXTENSION}")

    fun findProject(project: String): Project {
        val projectFile = getProjectFile(Project(project))
        return if (projectFile.exists())
            Project(project)
        else
            throw EntityNotFoundException(PROJECT_NOT_FOUND)
    }

    val listProjects = Handler { ctx ->
        val projects = workingDir
            .listDirectoryEntries("*.$EXTENSION")
            .map { it.nameWithoutExtension }
            .sorted()
        ctx.status(200).json(projects)
    }

    val createProject = Handler { ctx ->
        val project = ctx.bodyAsClass(Project::class.java)
        val projectFile = getProjectFile(project)
        if (projectFile.exists()) {
            throw EntityAlreadyExistsException(PROJECT_ALREADY_EXISTS)
        } else {
            projectFile.createFile()
            ConnectionManager.openConnection(projectFile).use { connection ->
                connection.createStatement().use {
                    it.execute(sqlCreateCategoryTable)
                    it.execute(sqlCreateItemTable)
                }
            }
            ctx.status(201).json(project)
        }
    }

    val deleteProject = Handler { ctx ->
        val projectFile = getProjectFile(findProject(ctx.pathParam(ID_KEY)))
        if (projectFile.exists()) {
            projectFile.deleteExisting()
            ctx.status(204)
        } else {
            throw EntityNotFoundException(PROJECT_NOT_FOUND)
        }
    }

    val getProject = Handler { ctx ->
        ctx.status(200).json(findProject(ctx.pathParam(ID_KEY)))
    }

    val updateProject = Handler { ctx ->
        val oldProjectFile = getProjectFile(findProject(ctx.pathParam(ID_KEY)))

        val project = ctx.bodyAsClass(Project::class.java)
        val projectFile = getProjectFile(project)
        if (projectFile.exists()) {
            throw EntityAlreadyExistsException(PROJECT_ALREADY_EXISTS)
        } else {
            oldProjectFile.moveTo(projectFile, overwrite = true)
            ctx.status(201).json(project)
        }
    }

    val uploadProjectFile = Handler { ctx ->
        val uploadedFile: UploadedFile =
            ctx.uploadedFile("file") ?: throw UploadFileMissingException("No file uploaded")
        val fileName: String = uploadedFile.filename()
        var file: Path = workingDir.resolve(fileName)
        val project = Project(file.nameWithoutExtension)
        val projectFile = getProjectFile(project)
        if (projectFile.exists()) {
            throw EntityAlreadyExistsException(PROJECT_ALREADY_EXISTS)
        }
        uploadedFile.content().transferTo(projectFile.outputStream())

        ctx.status(200).json(mapOf("message" to "File uploaded successfully."))
    }
}

object CategoryController {
    private val log: Logger = LoggerFactory.getLogger(CategoryController::class.java)

    const val ID_KEY = "category-id"
    private const val CATEGORY_NOT_FOUND = "Category not found"
    private const val CATEGORY_ALREADY_EXISTS = "Category already exists"

    private val sqlSelectAll = """
        SELECT *
            FROM category
            ORDER BY name
    """.trimIndent()

    private val sqlSelect = """
        SELECT *
            FROM category
            WHERE id = ?
    """.trimIndent()

    private val sqlInsert = """
        INSERT INTO category (name)
            VALUES (?)
            RETURNING *
    """.trimIndent()

    private val sqlUpdate = """
        UPDATE category
            SET name = ?
            WHERE id = ?
    """.trimIndent()

    private val sqlDelete = """
        DELETE FROM category
            WHERE id = ?
    """.trimIndent()

    fun getCategory(projectName: String, id: Int): Category {
        val project = ProjectController.findProject(projectName)
        ConnectionManager
            .openConnection(ProjectController.getProjectFile(project))
            .use { connection ->
                connection.prepareStatement(sqlSelect).use { statement ->
                    statement.setInt(1, id)
                    statement.executeQuery().use { resultSet ->
                        if (resultSet.next()) {
                            return Category(resultSet.getInt("id"), resultSet.getString("name"))
                        }
                        throw EntityNotFoundException(CATEGORY_NOT_FOUND)
                    }
                }
            }
    }

    val listCategories = Handler { ctx ->
        val projectId = ctx.pathParam(ProjectController.ID_KEY)
        val project = ProjectController.findProject(projectId)
        ConnectionManager
            .openConnection(ProjectController.getProjectFile(project))
            .use { connection ->
                connection.prepareStatement(sqlSelectAll).executeQuery().use { resultSet ->
                    val categories = mutableListOf<Category>()
                    while (resultSet.next()) {
                        categories.add(
                            Category(
                                resultSet.getInt("id"),
                                resultSet.getString("name")
                            )
                        )
                    }
                    ctx.status(200)
                    ctx.json(categories)
                }
            }
    }

    val createCategory = Handler { ctx ->
        val requestDto = ctx.bodyAsClass(CreateUpdateCategoryDto::class.java)
        log.info(requestDto.toString())
        ConnectionManager
            .openConnection(ProjectController.getProjectFile(Project(ctx.pathParam(ProjectController.ID_KEY))))
            .use { connection ->
                val statement = connection.prepareStatement(sqlInsert)
                statement.setString(1, requestDto.name)
                statement.executeQuery().use { resultSet ->
                    if (resultSet.next()) {
                        ctx.status(200)
                        ctx.json(Category(
                            resultSet.getInt("id"),
                            resultSet.getString("name")
                        ))
                    }
                }
            }
    }

    val updateCategory = Handler { ctx ->
        val projectId = ctx.pathParam(ProjectController.ID_KEY)
        val project = ProjectController.findProject(projectId)
        val categoryId = ctx.pathParam(ID_KEY).toInt()
        getCategory(projectId, categoryId)
        val requestDto = ctx.bodyAsClass(CreateUpdateCategoryDto::class.java)
        log.info(requestDto.toString())
        ConnectionManager
            .openConnection(ProjectController.getProjectFile(project))
            .use { connection ->
                val statement = connection.prepareStatement(sqlUpdate)
                statement.setString(1, requestDto.name)
                statement.setInt(2, ctx.pathParam(ID_KEY).toInt())
                statement.executeUpdate()
            }
    }

    val deleteCategory = Handler { ctx ->
        val projectId = ctx.pathParam(ProjectController.ID_KEY)
        val project: Project = ProjectController.findProject(projectId)
        val categoryId = ctx.pathParam(ID_KEY).toInt()
        getCategory(projectId, categoryId)
        ConnectionManager
            .openConnection(getProjectFile(project))
            .use { connection ->
                connection.createStatement().use { it.execute("PRAGMA foreign_keys = ON") }
                connection.prepareStatement(sqlDelete).use {
                    it.setInt(1, categoryId)
                    it.executeUpdate()
                }
            }
    }
}

object ItemController {
    private const val ID_KEY = "item-id"
    private const val MAX_LIMIT = 1000

    private fun sqlSelect(order: String, direction: String) = """
       SELECT *
           FROM item
           WHERE category_id = ?
           ORDER BY $order $direction
           LIMIT ?
           OFFSET ?
    """.trimIndent()

    private val sqlSelectTotalAndPassed = """
       SELECT COUNT(id)
           FROM item
           WHERE category_id = ?
       UNION ALL
       SELECT COUNT(id)
           FROM item
           WHERE category_id = ? AND passed
    """.trimIndent()

    private val sqlSelectById = """
       SELECT *
         FROM item
         WHERE category_id = ? AND id = ?
    """.trimIndent()

    private val sqlInsert = """
        INSERT INTO item (category_id, name, type, description, passed)
        VALUES (?, ?, ?, ?, ?)
        RETURNING id
    """.trimIndent()

    private val sqlUpdate = """
        UPDATE item SET name = ?, type = ?, description = ?, passed = ?
        WHERE id = ?
    """.trimIndent()

    private val sqlDelete = """
        DELETE FROM item
        WHERE id = ?
    """.trimIndent()

    private val sqlReset = """
        UPDATE item
            SET passed = false
            WHERE category_id = ?
    """.trimIndent()

    private fun sqlSearch(order: String, direction: String) = """
        SELECT *
            FROM item
            WHERE
                category_id = ?
                AND (LOWER(name) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?) OR LOWER(type) LIKE LOWER(?))
            ORDER BY $order $direction
            LIMIT ?
            OFFSET ?
    """.trimIndent()

    val log: Logger = LoggerFactory.getLogger(ItemController::class.java)

    val getItem = Handler { ctx ->
        ctx.json(getItem(
            Project(ctx.pathParam(ProjectController.ID_KEY)),
            ctx.pathParam(CategoryController.ID_KEY).toInt(),
            ctx.pathParam(ID_KEY).toInt())
        )
        ctx.status(200)
    }

    private fun getItem(project: Project, categoryId: Int, id: Int): Item {
        ConnectionManager
            .openConnection(getProjectFile(project))
            .use { connection ->
                val statement = connection.prepareStatement(sqlSelectById)
                statement.setInt(1, categoryId)
                statement.setInt(2, id)
                statement.executeQuery().use { resultSet ->
                    if (resultSet.next()) {
                        return Item(
                            resultSet.getInt("id"),
                            resultSet.getInt("category_id"),
                            resultSet.getString("name"),
                            resultSet.getString("description"),
                            resultSet.getBoolean("passed"),
                            resultSet.getString("type"),
                            project.name
                        )
                    } else {
                        throw EntityNotFoundException("Item not found with categoryId ${categoryId}, id $id")
                    }
                }
            }
    }

    private fun listItems(
        project: Project,
        categoryId: Int,
        order: String = "name",
        direction: String = "ASC",
        limit: Int = MAX_LIMIT,
        offset: Int = 0
    ): List<Item> {
        ConnectionManager
            .openConnection(getProjectFile(project))
            .use { connection ->
                val statement = connection.prepareStatement(sqlSelect(order, direction))
                statement.setInt(1, categoryId)
                statement.setInt(2, limit)
                statement.setInt(3, offset)
                statement.executeQuery().use { resultSet ->
                    val items = mutableListOf<Item>()
                    while (resultSet.next()) {
                        items.add(
                            Item(
                                resultSet.getInt("id"),
                                resultSet.getInt("category_id"),
                                resultSet.getString("name"),
                                resultSet.getString("description"),
                                resultSet.getBoolean("passed"),
                                resultSet.getString("type"),
                                project.name
                            )
                        )
                    }
                    return items
                }
            }
    }

    private fun getTotalAndPassedCount(project: Project, categoryId: Int): Pair<Int, Int> =
        ConnectionManager
            .openConnection(ProjectController.getProjectFile(project))
            .use { connection ->
                val statement = connection.prepareStatement(sqlSelectTotalAndPassed)
                statement.setInt(1, categoryId)
                statement.setInt(2, categoryId)
                statement.executeQuery().use { resultSet ->
                    var total = 0
                    if (resultSet.next()) {
                        total = resultSet.getInt(1)
                    }
                    var passed = 0
                    if (resultSet.next()) {
                        passed = resultSet.getInt(1)
                    }
                    return total to passed
                }
            }

    val listItems = Handler { ctx ->
        val projectId = ctx.pathParam(ProjectController.ID_KEY)
        val project: Project = ProjectController.findProject(projectId)
        val categoryId = ctx.pathParam("category-id").toInt()
        val order = ctx.queryParam("order") ?: "name"
        val direction = ctx.queryParam("direction") ?: "ASC"
        val limit = ctx.queryParam("limit")?.toInt() ?: MAX_LIMIT
        val offset = ctx.queryParam("offset")?.toInt() ?: 0
        val searchTerm: String = ctx.queryParam("search") ?: ""
        if (searchTerm.isNotEmpty()) {
            ctx.json(searchItems(project, categoryId, searchTerm, order, direction, limit, offset))
        } else {
            ctx.json(listItems(project, categoryId, order, direction, limit, offset))
            val counts = getTotalAndPassedCount(project, categoryId)
            ctx.header("X-Total-Count", counts.first.toString())
            ctx.header("X-Passed-Count", counts.second.toString())
            ctx.header("X-Limit", limit.toString())
            ctx.header("X-Offset", offset.toString())
        }
        ctx.status(200)
    }

    val createItem = Handler { ctx ->
        val project = Project(ctx.pathParam(ProjectController.ID_KEY))
        val categoryId = ctx.pathParam(CategoryController.ID_KEY).toInt()
        val dto = ctx.bodyAsClass(CreateUpdateItemDto::class.java)
        log.info(dto.toString())
        ConnectionManager
            .openConnection(ProjectController.getProjectFile(project))
            .use { connection ->
                val statement = connection.prepareStatement(sqlInsert)
                statement.setInt(1, categoryId)
                statement.setString(2, dto.name)
                statement.setString(3, dto.type)
                statement.setString(4, dto.description)
                statement.setBoolean(5, dto.passed)
                statement.executeQuery().use { resultSet ->
                    if (resultSet.next()) {
                        val id = resultSet.getInt("id")
                        val item = Item(
                            id,
                            categoryId,
                            dto.name,
                            dto.description,
                            dto.passed,
                            dto.type,
                            project.name
                        )
                        ctx.status(201)
                        ctx.json(item)
                    }
                }
            }
    }

    val updateItem = Handler { ctx ->
        val project = Project(ctx.pathParam(ProjectController.ID_KEY))
        val categoryId = ctx.pathParam(CategoryController.ID_KEY).toInt()
        val id = ctx.pathParam(ID_KEY).toInt()
        ConnectionManager
            .openConnection(ProjectController.getProjectFile(project))
            .use { connection ->
                val dto = ctx.bodyAsClass(CreateUpdateItemDto::class.java)
                val statement = connection.prepareStatement(sqlUpdate)
                statement.setString(1, dto.name)
                statement.setString(2, dto.type)
                statement.setString(3, dto.description)
                statement.setBoolean(4, dto.passed)
                statement.setInt(5, ctx.pathParam(ID_KEY).toInt())
                statement.executeUpdate()
            }
        ctx.json(getItem(project, categoryId, id))
        ctx.status(200)
    }

    val deleteItem = Handler { ctx ->
        ConnectionManager
            .openConnection(ProjectController.getProjectFile(
                Project(ctx.pathParam(ProjectController.ID_KEY)))
            ).use { connection ->
                val statement = connection.prepareStatement(sqlDelete)
                statement.setInt(1, ctx.pathParam(ID_KEY).toInt())
                statement.executeUpdate()
            }
    }

    val randomNotPassedItem = Handler { ctx ->
        val project = Project(ctx.pathParam(ProjectController.ID_KEY))
        val notPassedItems = listItems(
            project,
            ctx.pathParam("category-id").toInt()
        ).filter { item -> !item.passed }
        val numOfNotPassedItems = notPassedItems.size
        if (numOfNotPassedItems > 0) {
            ctx.status(200)
            ctx.json(notPassedItems.random())
        } else {
            throw EntityNotFoundException("No item can be chosen randomly.")
        }
    }

    val resetCategoryItems = Handler { ctx ->
        val projectId = ctx.pathParam(ProjectController.ID_KEY)
        val project: Project = ProjectController.findProject(projectId)
        val categoryId = ctx.pathParam(CategoryController.ID_KEY).toInt()
        CategoryController.getCategory(projectId, categoryId)
        ConnectionManager
            .openConnection(getProjectFile(project))
            .use { connection ->
                val statement = connection.prepareStatement(sqlReset)
                statement.setInt(1, categoryId)
                statement.executeUpdate()
                val items = listItems(project, categoryId)
                ctx.status(200)
                ctx.json(items)
            }
    }

    private fun searchItems(
        project: Project,
        categoryId: Int,
        searchTerm: String,
        order: String,
        direction: String,
        limit: Int,
        offset: Int
    ): List<Item> {
        ConnectionManager
            .openConnection(ProjectController.getProjectFile(project))
            .use { connection ->
                val statement = connection.prepareStatement(sqlSearch(order, direction))
                statement.setInt(1, categoryId)
                statement.setString(2, "%$searchTerm%")
                statement.setString(3, "%$searchTerm%")
                statement.setString(4, "%$searchTerm%")
                statement.setInt(5, limit)
                statement.setInt(6, offset)
                val items = mutableListOf<Item>()
                val resultSet = statement.executeQuery()
                while (resultSet.next()) {
                    items.add(Item(
                        resultSet.getInt("id"),
                        resultSet.getInt("category_id"),
                        resultSet.getString("name"),
                        resultSet.getString("description"),
                        resultSet.getBoolean("passed"),
                        resultSet.getString("type"),
                        project.name,
                    ))
                }
                return items
            }
    }

    @OptIn(ExperimentalAtomicApi::class)
    val isImportInProgress = AtomicBoolean(false)
    var oldImportProgress = 0.0
    var importProgress = 0.0

    @OptIn(ExperimentalAtomicApi::class)
    val importItems = Handler { ctx ->
        if (isImportInProgress.compareAndSet(expectedValue = false, newValue = true)) {
            val uploadedFile: UploadedFile =
                ctx.uploadedFile("file") ?: throw UploadFileMissingException("No file uploaded")
            val fileName: String = uploadedFile.filename()
            var file: Path = workingDir.resolve(fileName)
            uploadedFile.content().transferTo(file.outputStream())

            val project = Project(ctx.pathParam(ProjectController.ID_KEY))
            val categoryId = ctx.pathParam(CategoryController.ID_KEY).toInt()
            Thread {
                isImportInProgress.store(true)
                ConnectionManager
                    .openConnection(getProjectFile(project))
                    .use { connection ->
                        val lines = FileInputStream(file.toFile()).bufferedReader(Charsets.UTF_8).use { it.readLines() }
                        lines.forEachIndexed { index, line ->
                            val fields = line.split("|")
                            val statement = connection.prepareStatement(sqlInsert)
                            statement.setInt(1, categoryId)
                            statement.setString(2, fields[0])
                            statement.setString(3, fields[1])
                            statement.setString(4, fields[2])
                            statement.setBoolean(5, fields[3].toBoolean())
                            statement.executeQuery()
                            Thread.sleep(10_000)
                            importProgress = (index + 1).toDouble() / lines.size * 100.0
                        }
                    }
                isImportInProgress.compareAndSet(expectedValue = true, newValue = false)
            }.start()

            ctx.status(201)
        } else {
            ctx.status(409)
        }
    }

    @OptIn(ExperimentalAtomicApi::class)
    fun importProgress(client: SseClient) {
        if (oldImportProgress != importProgress) {
            log.info("SSE PROGRESS:$importProgress")
            val progress = mapOf("value" to importProgress)
            client.sendEvent("progress", jacksonObjectMapper().writeValueAsString(progress))
            oldImportProgress = importProgress
        }
    }
}

fun main() {
    Javalin.create { config ->
        config.bundledPlugins.enableCors { it.addRule { rule -> rule.anyHost() } }
        config.routes.apiBuilder {
            before(Auth.bearerToken)
            path("/sse/progress") {
                sse { client -> ItemController.importProgress(client) }
            }
            path("/api/v1/projects") {
                get(ProjectController.listProjects)
                post(ProjectController.createProject)
                path("/upload") {
                    post(ProjectController.uploadProjectFile)
                }
                path("/{project-name}") {
                    get(ProjectController.getProject)
                    delete(ProjectController.deleteProject)
                    put(ProjectController.updateProject)
                    path("/categories") {
                        get(CategoryController.listCategories)
                        post(CategoryController.createCategory)
                        path("/{category-id}") {
                            put(CategoryController.updateCategory)
                            delete(CategoryController.deleteCategory)
                            path("/items") {
                                get(ItemController.listItems)
                                post(ItemController.createItem)
                                path("/{item-id}") {
                                    put(ItemController.updateItem)
                                    delete(ItemController.deleteItem)
                                }
                                path("/random") {
                                    get(ItemController.randomNotPassedItem)
                                }
                                path("/{item-id}") {
                                    get(ItemController.getItem)
                                }
                            }
                            path("/import") {
                                post(ItemController.importItems)
                            }
                            path("/reset") {
                                post(ItemController.resetCategoryItems)
                            }
                        }
                    }
                }
            }
        }
        config.routes.exception(EntityAlreadyExistsException::class.java) { e, ctx ->
            ctx.status(409).json(Error(1, e.message!!))
        }
        config.routes.exception(EntityNotFoundException::class.java) { e, ctx ->
            ctx.status(404).json(Error(2, e.message!!))
        }
        config.routes.exception(NumberFormatException::class.java) { e, ctx ->
            ctx.status(400).json(Error(3, e.message!!))
        }
        config.routes.exception(UploadFileMissingException::class.java) { e, ctx ->
            ctx.status(400).json(Error(4, e.message!!))
        }
        config.routes.exception(UnauthorizedException::class.java) { e, ctx ->
            ctx.header("WWW-Authenticate", "Bearer")
            ctx.status(401).json(Error(5, e.message!!))
        }
        config.routes.after { ctx -> ctx.header(
            "Access-Control-Expose-Headers",
            "X-Total-Count, X-Passed-Count"
        ) }
    }.start(7070)
}
