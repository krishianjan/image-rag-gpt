const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8000'

export const getToken = (): string => localStorage.getItem('dm_token') ?? ''
export const isAuthed = (): boolean => !!localStorage.getItem('dm_token')

function authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${getToken()}` }
}
function jsonHeaders(): Record<string, string> {
    return { ...authHeaders(), 'Content-Type': 'application/json' }
}
async function handleResponse(res: Response) {
    if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(body.detail ?? `HTTP ${res.status}`)
    }
    return res.json()
}

export async function createTenant(name: string) {
    const res = await fetch(`${API_BASE}/v1/auth/tenants`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    })
    return handleResponse(res)
}

export async function fetchToken(tenantId: string) {
    const res = await fetch(`${API_BASE}/v1/auth/token?tenant_id=${tenantId}`, { method: 'POST' })
    return handleResponse(res)
}

export async function uploadDocument(file: File) {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API_BASE}/v1/upload`, {
        method: 'POST', headers: authHeaders(), body: form,
    })
    return handleResponse(res)
}

export async function getDocStatus(docId: string) {
    const res = await fetch(`${API_BASE}/v1/documents/${docId}/status`, { headers: authHeaders() })
    return handleResponse(res)
}

export async function getDocMetadata(docId: string) {
    const res = await fetch(`${API_BASE}/v1/documents/${docId}/metadata`, { headers: authHeaders() })
    return handleResponse(res)
}

export async function getFileUrl(docId: string): Promise<{ url: string }> {
    const res = await fetch(`${API_BASE}/v1/documents/${docId}/file`, { headers: authHeaders() })
    return handleResponse(res)
}

export async function getExtraction(docId: string) {
    const res = await fetch(`${API_BASE}/v1/agent/extraction/${docId}`, { headers: authHeaders() })
    if (res.status === 404) return null
    return handleResponse(res)
}

export interface SSEEvent {
    type: 'session_id' | 'sources' | 'token' | 'done' | 'error'
    session_id?: string
    sources?: Array<{ page: number; bbox: Record<string, number> }>
    token?: string
    full_text?: string
    message?: string
}

export async function* streamChat(
    docId: string,
    question: string,
    sessionId: string | null,
    modelPreference: string = 'auto',
): AsyncGenerator<SSEEvent> {
    const res = await fetch(`${API_BASE}/v1/agent/chat`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({
            doc_id: docId,
            question,
            session_id: sessionId,
            model_preference: modelPreference,
        }),
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Chat failed' }))
        throw new Error(err.detail)
    }
    const sid = res.headers.get('X-Session-Id')
    if (sid) yield { type: 'session_id', session_id: sid }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try { yield JSON.parse(line.slice(6)) as SSEEvent } catch { }
        }
    }
}

export async function getReviews() {
    const res = await fetch(`${API_BASE}/v1/reviews`)
    return handleResponse(res)
}

export async function submitReview(payload: { name: string; role: string; stars: number; review: string }) {
    const res = await fetch(`${API_BASE}/v1/reviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    return handleResponse(res)
}

export async function searchDoc(docId: string, query: string, topK = 8) {
    const res = await fetch(`${API_BASE}/v1/search`, {
        method: 'POST', headers: jsonHeaders(),
        body: JSON.stringify({ doc_id: docId, query, top_k: topK, layer: 'leaf' }),
    })
    return handleResponse(res)
}