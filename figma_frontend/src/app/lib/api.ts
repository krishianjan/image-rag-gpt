const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders() {
  const token = localStorage.getItem('dm_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function createTenant(name: string) {
  const res = await fetch(`${API_BASE}/v1/auth/tenants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  return handleResponse(res)
}

export async function fetchToken(tenantId: string) {
  const res = await fetch(`${API_BASE}/v1/auth/token?tenant_id=${tenantId}`, {
    method: 'POST',
  })
  return handleResponse(res)
}

export async function uploadDocument(file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/v1/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  return handleResponse(res)
}

export async function getDocStatus(docId: string) {
  const res = await fetch(`${API_BASE}/v1/documents/${docId}/status`, {
    headers: authHeaders(),
  })
  return handleResponse(res)
}

export async function getFileUrl(docId: string) {
  const res = await fetch(`${API_BASE}/v1/documents/${docId}/file`, {
    headers: authHeaders(),
  })
  return handleResponse(res)
}

export async function getExtraction(docId: string) {
  const res = await fetch(`${API_BASE}/v1/agent/extraction/${docId}`, {
    headers: authHeaders(),
  })
  if (res.status === 404) return null
  return handleResponse(res)
}

export async function* streamChat(
  docId: string,
  question: string,
  sessionId: string | null,
  modelPref: string = 'auto'
) {
  const res = await fetch(`${API_BASE}/v1/agent/chat`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      doc_id: docId,
      question,
      session_id: sessionId,
      model_preference: modelPref,
    }),
  })
  if (!res.ok) throw new Error('Chat failed')

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
      if (line.startsWith('data: ')) {
        try {
          yield JSON.parse(line.slice(6))
        } catch {}
      }
    }
  }
}
