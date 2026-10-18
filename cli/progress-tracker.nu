#!/usr/bin/env nu

use api.nu *

def progress [items: table] {
    let total = ($items | length)
    let passed = ($items | where passed == true | length)

    if $total == 0 {
        "0/0 (0%)"
    } else {
        let percent = ($passed * 100 / $total) | math round
        $"($passed)/($total) \(($percent)%\)"
    }
}

### PROJECTS

def recordify-projects [projects: list<string>] {
    $projects | each {|it| { name: $it }}
}

export def "pt projects" [--url: string = $DEFAULT_BASE_URL] {
    recordify-projects (api-get $url "/api/v1/projects")
}

export def "pt projects add" [name: string --url: string = $DEFAULT_BASE_URL] {
    api-post $url "/api/v1/projects" { name: $name }
}

export def "pt projects rename" [old_name: string new_name: string --url: string = $DEFAULT_BASE_URL] {
    api-put $url $"/api/v1/projects/(segment $old_name)" { name: $new_name }
}

export def "pt projects delete" [name: string --url: string = $DEFAULT_BASE_URL] {
    api-delete $url $"/api/v1/projects/(segment $name)"
}

### CATEGORIES

export def "pt categories" [project: string --url: string = $DEFAULT_BASE_URL] {
    api-get $url (category-path $project)
}

export def "pt categories add" [project: string name: string --url: string = $DEFAULT_BASE_URL
] {
    api-post $url (category-path $project) { name: $name }
}

export def "pt categories rename" [project: string category_id: int name: string --url: string = $DEFAULT_BASE_URL] {
    api-put $url $"(category-path $project)/($category_id)" { name: $name }
}

export def "pt categories delete" [project: string category_id: int --url: string = $DEFAULT_BASE_URL] {
    api-delete $url $"(category-path $project)/($category_id)"
}

### ITEMS

export def "pt items" [
    project: string
    category_id: int
    --search: string = ""
    --order: string = "name"
    --direction: string = "ASC"
    --limit: int = 1000
    --offset: int = 0
    --url: string = $DEFAULT_BASE_URL
] {
    let path = (item-path $project $category_id)
    let query = {
            order: $order
            direction: $direction
            limit: $limit
            offset: $offset
            search: $search
        }
        | url build-query

    let items = (api-get $url $"($path)?($query)")
    { progress: (progress $items) items: ($items | select id name type passed description) }
}

export def "pt items add" [
    project: string
    category_id: int
    name: string
    type: string = ""
    description: string = ""
    --passed
    --url: string = $DEFAULT_BASE_URL
] {
    api-post $url (item-path $project $category_id) {
        name: $name
        type: $type
        description: $description
        passed: $passed
    }
}

export def "pt items get" [project: string category_id: int item_id: int --url: string = $DEFAULT_BASE_URL] {
    api-get $url $"(item-path $project $category_id)/($item_id)"
}

export def "pt items update" [
    project: string
    category_id: int
    item_id: int
    --name: string
    --type: string
    --description: string
    --url: string = $DEFAULT_BASE_URL
] {
    let current = (api-get $url $"(item-path $project $category_id)/($item_id)")

    api-put $url $"(item-path $project $category_id)/($item_id)" {
        name: ($name | default $current.name)
        type: ($type | default $current.type)
        description: ($description | default $current.description)
        passed: $current.passed
    }
}

export def "pt items pass" [project: string category_id: int item_id: int --url: string = $DEFAULT_BASE_URL] {
    let current = (api-get $url $"(item-path $project $category_id)/($item_id)")

    api-put $url $"(item-path $project $category_id)/($item_id)" {
        name: $current.name
        type: $current.type
        description: $current.description
        passed: true
    }
}

export def "pt items fail" [project: string category_id: int item_id: int --url: string = $DEFAULT_BASE_URL] {
    let current = (api-get $url $"(item-path $project $category_id)/($item_id)")

    api-put $url $"(item-path $project $category_id)/($item_id)" {
        name: $current.name
        type: $current.type
        description: $current.description
        passed: false
    }
}

export def "pt items delete" [project: string category_id: int item_id: int --url: string = $DEFAULT_BASE_URL] {
    api-delete $url $"(item-path $project $category_id)/($item_id)"
}

export def "pt items random" [project: string category_id: int --url: string = $DEFAULT_BASE_URL] {
    api-get $url $"(item-path $project $category_id)/random"
}

export def "pt items reset" [project: string category_id: int --url: string = $DEFAULT_BASE_URL] {
    api-post $url $"/api/v1/projects/(segment $project)/categories/($category_id)/reset" {}
}

### MAIN

def main [] {
    print "Progress Tracker Nushell CLI"
    print ""
    print "Examples:"
    print "  pt projects"
    print "  pt categories Task"
    print "  pt items Task 1"
    print "  pt items add Task 1 \"Read docs\" learning \"Javalin routing\""
    print "  pt items pass Task 1 3"
}
