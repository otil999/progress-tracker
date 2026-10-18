export const DEFAULT_BASE_URL = "https://progress-tracker.ddns.net"

export def segment [value: any] {
    $value | into string | url encode
}

export def api-url [url: string, path: string] {
    let base = ($url | str trim --right --char "/")
    $"($base)($path)"
}

# Bearer token read from the PT_API_TOKEN environment variable.
export def auth-headers [] {
    let token = ($env.PT_API_TOKEN? | default "")
    if ($token | is-empty) {
        error make { msg: "PT_API_TOKEN environment variable must be set" }
    }
    { Authorization: $"Bearer ($token)" }
}

export def api-get [url: string, path: string] {
    http get -k --headers (auth-headers) (api-url $url $path)
}

export def api-post [base_url: string, path: string, body: record] {
    http post -k --content-type application/json --headers (auth-headers) (api-url $base_url $path) ($body | to json)
}

export def api-put [base_url: string, path: string, body: record] {
    print $body
    http put -k --content-type application/json --headers (auth-headers) (api-url $base_url $path) ($body | to json)
}

export def api-delete [base_url: string, path: string] {
    http delete -k --headers (auth-headers) (api-url $base_url $path)
}

export def item-path [project: string, category_id: int] {
    $"/api/v1/projects/(segment $project)/categories/($category_id)/items"
}

export def category-path [project: string] {
    $"/api/v1/projects/(segment $project)/categories"
}
