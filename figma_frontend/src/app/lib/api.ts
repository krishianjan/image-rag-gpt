const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const DEFAULT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRfaWQiOiIxYjk5YzdkNy1lZTU1LTQ2ZDktYTMxOC1kZWJhMWIwOGMzNjMiLCJzdWIiOiJ0ZXN0In0.j2ctBnU9Yq--bQDb4bLC_3vzJcNiYEodmvkknljfNtQ'

function getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}
    const token = localStorage.getItem('dm_token') || DEFAULT_TOKEN
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    return headers
}

async function handleResponse(res: Response) {
    const text = await res.text()
    if (!res.ok) {
        try {
            const err = JSON.parse(text)
            throw new Error(err.detail || `HTTP ${res.status}`)
        } catch {
            throw new Error(text || `HTTP ${res.status}`)
        }
    }
    try {
        return JSON.parse(text)
    } catch {
        return text
    }
}

export async function uploadDocument(file: File) {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API_BASE}/v1/upload/`, {
        method: 'POST',
        headers: getHeaders(),
        body: form,
    })
    return handleResponse(res)
}

export async function getDocStatus(docId: string) {
    const res = await fetch(`${API_BASE}/v1/documents/${docId}/status`, {
        headers: getHeaders(),
    })
    return handleResponse(res)
}

export async function getFileUrl(docId: string) {
    const res = await fetch(`${API_BASE}/v1/documents/${docId}/file`, {
        headers: getHeaders(),
    })
    return handleResponse(res)
}

export async function getExtraction(docId: string) {
    const res = await fetch(`${API_BASE}/v1/agent/extraction/${docId}`, {
        headers: getHeaders(),
    })
    if (res.status === 404) return null
    return handleResponse(res)
}

export async function* streamChat(
    docId: string,
    question: string,
    sessionId: string | null,
) {
    const res = await fetch(`${API_BASE}/v1/agent/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getHeaders(),
        },
        body: JSON.stringify({
            doc_id: docId,
            question,
            session_id: sessionId,
        }),
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail || `HTTP ${res.status}`)
    }

    const reader = res.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') return
                try {
                    yield JSON.parse(data)
                } catch {
                    // skip malformed chunks
                }
            }
        }
    }
}

export async function getChatHistory(docId: string) {
    const res = await fetch(`${API_BASE}/v1/agent/sessions/${docId}`, {
        headers: getHeaders(),
    })
    return handleResponse(res)
}

export async function searchDocuments(query: string, tenantId?: string) {
    const params = new URLSearchParams({ q: query })
    if (tenantId) params.append('tenant_id', tenantId)
    
    const res = await fetch(`${API_BASE}/v1/search/?${params}`, {
        headers: getHeaders(),
    })
    return handleResponse(res)
}

export async function getReviews(docId?: string) {
    const url = docId ? `${API_BASE}/v1/reviews/${docId}` : `${API_BASE}/v1/reviews/`
    const res = await fetch(url, { headers: getHeaders() })
    if (res.status === 404) return []
    return handleResponse(res)
}
