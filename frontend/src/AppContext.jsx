import { createContext, useContext, useState } from "react"
import { calculateProgress, fetchApi } from "./utils.js"
import ConfirmDialog from "./ConfirmDialog.jsx"
import ComboValueEditorDialog from "./ComboValueEditorDialog.jsx"
import ImportProgressDialog from "./ImportProgressDialog.jsx"
import LoginDialog from "./LoginDialog.jsx";

const AppContext = createContext()

export const AppContextProvider = ({ children }) => {
    const [selectedProject, setSelectedProject] = useState('')
    const [projectOptions, setProjectOptions] = useState([])
    const [selectedCategoryId, setSelectedCategoryId] = useState('')
    const [categoryOptions, setCategoryOptions] = useState([])
    const [status, setStatus] = useState({ severity: '', message: '', open: false })
    const [ordering, setOrdering] = useState({ column: 'name', direction: 'asc' })
    const [progress, setProgress] = useState(0)
    const [items, setItems] = useState([])
    const [totalCount, setTotalCount] = useState(0)
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(25)
    const [importProgress, setImportProgress] = useState(0)
    const [dialog, setDialog] = useState({})
    const [search, setSearch] = useState('')

    return (
        <AppContext.Provider
            value={{
                selectedProject,
                setSelectedProject,
                projectOptions,
                setProjectOptions,
                selectedCategoryId,
                setSelectedCategoryId,
                categoryOptions,
                setCategoryOptions,
                status,
                setStatus,
                progress,
                setProgress,
                items,
                setItems,
                totalCount,
                setTotalCount,
                page,
                setPage,
                rowsPerPage,
                setRowsPerPage,
                ordering,
                setOrdering,
                importProgress,
                setImportProgress,
                dialog,
                setDialog,
                search,
                setSearch
            }}
        >
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = () => {
    return useContext(AppContext)
}

export const useStatus = () => {
    const { setStatus } = useAppContext()

    const show = (severity, message) => {
        setStatus({ severity, message, open: true })
    }

    return {
        info: (message) => show('info', message),
        success: (message) => show('success', message),
        error: (message) => show('error', message.message ? message.message : message),
        warning: (message) => show('warning', message)
    }
}

export const useDialog = () => {
    const renderDialog = (dialog) => {
        console.log(dialog)
        switch (dialog.type) {
            case "confirm":
                return <ConfirmDialog/>
            case "edit":
                return <ComboValueEditorDialog/>
            case "import":
                return <ImportProgressDialog/>
            case "login":
                return <LoginDialog/>
        }
    }

    return {
        renderDialog
    }
}

export const useProjectApi = () => {
    const { error, success } = useStatus()
    const { setSelectedProject, setProjectOptions, setConfirm } = useAppContext()

    const fetchProjects = (selected) => {
        fetchApi({ endpoint: '/api/v1/projects' })
            .then(data => {
                setProjectOptions(data.content)
                setSelectedProject(selected)
            })
            .catch(data => error(data))
    }

    const deleteProject = (project) => {
        fetchApi({ endpoint: `/api/v1/projects/${project}`, options: { method: 'DELETE' } })
            .then(() => {
                setConfirm(prev => ({ ...prev, open: false }))
                success("Project is deleted successfully.")
                fetchProjects('')
            })
            .catch(data => error(data))
    }

    const createProject = (name) => {
        fetchApi({
            endpoint: '/api/v1/projects',
            options: { method: 'POST', body: JSON.stringify({ name }) }
        })
            .then(() => {
                success("Project is created successfully.")
                fetchProjects(name)
            })
            .catch(data => error(data))
    }

    const uploadProjectFile = (file) => {
        const formData = new FormData()
        formData.append('file', file)

        fetchApi({
            endpoint: '/api/v1/projects/upload',
            options: { method: 'POST', body: formData }
        })
            .then(() => {
                success("File is uploaded successfully as a new project.")
                fetchProjects(name)
            })
            .catch(data => error(data))
    }

    const updateProject = (oldName, newName) => {
        fetchApi({
            endpoint: `/api/v1/projects/${oldName}`,
            options: { method: 'PUT', body: JSON.stringify({ name: newName }) }
        })
            .then(() => {
                success("Project is updated successfully.")
                fetchProjects(newName)
            })
            .catch(data => error(data))
    }

    return {
        fetchProjects,
        createProject,
        uploadProjectFile,
        updateProject,
        deleteProject
    }
}

export const useCategoryApi = () => {
    const { error, success } = useStatus()
    const { setSelectedCategoryId, setCategoryOptions, setItems, setDialog } = useAppContext()

    const fetchCategories = (project) => {
        fetchApi({ endpoint: `/api/v1/projects/${project}/categories` })
            .then(data => {
                const categories = data.content.map(category => ({ id: category.id, name: category.name }))
                setCategoryOptions(categories)
                setSelectedCategoryId('')
            })
            .catch(data => {
                setSelectedCategoryId('')
                setCategoryOptions([])
                setItems([])
                error(data)
            })
    }

    const deleteCategory = (project, categoryId) => {
        fetchApi({ endpoint: `/api/v1/projects/${project}/categories/${categoryId}`, options: { method: 'DELETE' } })
            .then(() => {
                setDialog(prev => ({ ...prev, open: false }))
                success("Category is deleted successfully.")
                fetchCategories(project, '')
            })
            .catch(data => error(data))
    }

    const resetCategory = (project, categoryId) => {
        fetchApi({ endpoint: `/api/v1/projects/${project}/categories/${categoryId}/reset`, options: { method: 'POST' } })
            .then(data => {
                success("Category is reset successfully.")
                setItems(data.content)
            })
            .catch(data => error(data))
    }

    const createCategory = (project, name) => {
        fetchApi({
            endpoint: `/api/v1/projects/${project}/categories`,
            options: { method: 'POST', body: JSON.stringify({ name }) }
        })
            .then(() => {
                success("Category is created successfully.")
                fetchCategories(project, name)
            })
            .catch(data => error(data))

    }

    const updateCategory = (project, id, newName) => {
        fetchApi({
            endpoint: `/api/v1/projects/${project}/categories/${id}`,
            options: { method: 'PUT', body: JSON.stringify({ name: newName }) }
        })
            .then(() => {
                success("Category is updated successfully.")
                fetchCategories(project, id)
            })
            .catch(data => error(data))
    }

    return {
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        resetCategory
    }
}

export const useItemApi = () => {
    const {error, success} = useStatus()
    const {selectedProject, selectedCategoryId, setItems, setProgress, setTotalCount, page, rowsPerPage, ordering, search} = useAppContext()

    const fetchItems = () => {
        let offset = page * rowsPerPage
        fetchApi({endpoint: `/api/v1/projects/${selectedProject}/categories/${selectedCategoryId}/items?limit=${rowsPerPage}&offset=${offset}&order=${ordering.column}&direction=${ordering.direction}`})
            .then(data => {
                setItems(data.content)
                setTotalCount(data.totalCount)
                setProgress(calculateProgress(data.passedCount, data.totalCount))
            })
            .catch(data => error(data))
    }

    const createItem = (data) => {
        fetchApi({
            endpoint: `/api/v1/projects/${selectedProject}/categories/${selectedCategoryId}/items`,
            options: { method: 'POST', body: JSON.stringify(data) }
        })
            .then(() => {
                success("Item is created successfully.")
                fetchItems()
            })
            .catch(data => error(data))
    }

    const deleteItem = (itemId) => {
        fetchApi({
            endpoint: `/api/v1/projects/${selectedProject}/categories/${selectedCategoryId}/items/${itemId}`,
            options: { method: 'DELETE' }
        })
            .then(() => {
                success("Item is deleted successfully.")
                fetchItems()
            })
            .catch(data => error(data))
    }

    const updateItem = (data) => {
        const dto = {
            name: data.name,
            description: data.description,
            type: data.type,
            passed: data.passed
        }
        fetchApi({
            endpoint: `/api/v1/projects/${selectedProject}/categories/${selectedCategoryId}/items/${data.id}`,
            options: { method: 'PUT', body: JSON.stringify(dto) }
        })
            .then(() => {
                success("Item is updated successfully.")
                fetchItems()
            })
            .catch(data => error(data))
    }

    const randomNotPassedItem = () => {
        fetchApi({endpoint: `/api/v1/projects/${selectedProject}/categories/${selectedCategoryId}/items/random`})
            .then(data => {
                setItems([data.content])
            })
            .catch(data => error(data))
    }

    const searchItems = () => {
        let offset = page * rowsPerPage
        fetchApi({endpoint: `/api/v1/projects/${selectedProject}/categories/${selectedCategoryId}/items?search=${search}&order=${ordering.column}&direction=${ordering.direction}&limit=${rowsPerPage}&offset=${offset}`})
            .then(data => {
                setItems(data.content)
                setTotalCount(data.content.length)
                setProgress(0)
            })
            .catch(data => error(data))
    }

    const importItems = (file) => {
        const formData = new FormData()
        formData.append('file', file)

        fetchApi({
            endpoint: `/api/v1/projects/${selectedProject}/categories/${selectedCategoryId}/import`,
            options: { method: 'POST', body: formData }
        })
            .then(() => {
                success("File is uploaded successfully as a new project.")
            })
            .catch(data => error(data))
    }

    return {
        fetchItems,
        createItem,
        updateItem,
        deleteItem,
        randomNotPassedItem,
        searchItems,
        importItems
    }
}
