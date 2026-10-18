# Progress Tracker — Nushell CLI

A [Nushell](https://www.nushell.sh/) CLI frontend for the Progress Tracker Javalin backend in this repository.

- `api.nu` — HTTP helpers and path builders shared by the commands.
- `progress-tracker.nu` — the user-facing `pt` commands.

## Requirements

- [Nushell](https://www.nushell.sh/) installed and on your `PATH`.
- The Progress Tracker backend running. By default the CLI talks to `http://localhost:7070`.

## Loading the commands

The commands are exported as a `pt` command group. Import them into your Nushell session with `use`:

```nu
use progress-tracker.nu *
```

Then call any command, for example:

```nu
pt projects
```

You can also run the script directly to print usage examples:

```nu
nu progress-tracker.nu
```

## Choosing a backend URL

Every command accepts a `--url` flag to override the default backend (`http://localhost:7070`):

```nu
pt projects --url http://localhost:8080
```

## Commands

### Projects

```nu
pt projects                              # list all projects
pt projects add <name>                   # create a project
pt projects rename <old_name> <new_name> # rename a project
pt projects delete <name>                # delete a project
```

### Categories

Categories belong to a project (referenced by name):

```nu
pt categories <project>                            # list categories
pt categories add <project> <name>                 # create a category
pt categories rename <project> <category_id> <name> # rename a category
pt categories delete <project> <category_id>       # delete a category
```

### Items

Items belong to a category (referenced by its numeric `category_id`):

```nu
pt items <project> <category_id>          # list items (with progress summary)
pt items add <project> <category_id> <name> <type> [description] [--passed]
pt items get <project> <category_id> <item_id>
pt items update <project> <category_id> <item_id> [--name] [--type] [--description]
pt items pass <project> <category_id> <item_id>    # mark item passed
pt items fail <project> <category_id> <item_id>    # mark item not passed
pt items delete <project> <category_id> <item_id>
pt items random <project> <category_id>            # fetch a random item
pt items reset <project> <category_id>             # reset all items in a category
```

`pt items` returns a record with a `progress` field (e.g. `3/10 (30%)`, the share of
items marked `passed`) and the matching `items` table.

#### Listing options

`pt items` supports filtering and pagination flags:

| Flag          | Default | Description                          |
| ------------- | ------- | ------------------------------------ |
| `--search`    | `""`    | filter items by search term          |
| `--order`     | `name`  | column to order by                   |
| `--direction` | `ASC`   | sort direction (`ASC` / `DESC`)      |
| `--limit`     | `1000`  | maximum number of items to return    |
| `--offset`    | `0`     | number of items to skip              |

## Examples

```nu
use progress-tracker.nu *

pt projects add Task
pt categories add Task Kotlin
pt items add Task 1 "Read docs" learning "Javalin routing"
pt items pass Task 1 3
pt items Task 1 --search docs --order name --direction DESC
pt items random Task 1
```

## Discovering commands

Use Nushell's built-in help to explore each command group:

```nu
pt projects --help
pt categories --help
pt items --help
```
