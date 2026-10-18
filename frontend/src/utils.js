export const host = import.meta.env.VITE_API_URI
export const apiToken = import.meta.env.VITE_API_TOKEN

export const fetchApi = async ({ endpoint, options }) => {
    const api = `${host}${endpoint}`
    const method = options && options.method ? options.method : 'GET'
    console.info(`Remote API call ${method} ${api}...`)
    const authedOptions = {
        ...options,
        headers: {
            ...(options && options.headers),
            ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
        },
    }
    const res = await fetch(api, authedOptions)
    const contentType = res.headers.get("Content-Type")
    const totalCount = res.headers.get("X-Total-Count")
    const passedCount = res.headers.get("X-Passed-Count")
    const content = contentType?.includes("application/json") ? await res.json() : await res.text()
    if (res.ok) return { content: content, totalCount: totalCount, passedCount: passedCount }
    throw new Error(
        content.code ? `${content.code}:${content.message}` : content
    )
}

export const calculateProgress = (passed, total) => {
    return Math.round((passed / total) * 100)
}
