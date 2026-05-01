import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ModelSelector from '../components/ModelSelector'
import {
    ArrowLeft, Send, Loader2, FileText, Brain,
    BookOpen, AlertTriangle, CheckCircle2, Copy, ChevronDown, ChevronUp, Save,
} from 'lucide-react'
import { getDocStatus, getFileUrl, getExtraction, streamChat } from '../lib/api'
import { store } from '../lib/store'

interface DocStatus {
    doc_id: string; status: string; doc_type: string
    page_count: number | null; word_count: number | null
}
interface Extraction {
    summary: string | null; key_findings: string[]; key_points: string[]
    ignore_points: string[]
    extracted_json: Record<string, unknown> | null
    confidence_scores: Record<string, number> | null
}
interface ChatMessage {
    id: string; role: 'user' | 'assistant'; content: string
    sources?: Array<{ page: number; bbox: Record<string, number> }>
    streaming?: boolean
}

const SESSION_KEY = (docId: string) => `dm_session_${docId}`
const MESSAGES_KEY = (docId: string) => `dm_messages_${docId}`

const SUGGESTED = [
    'Summarize this document for me',
    'What are the key risks or concerns?',
    'Extract all dates and deadlines',
    'Who are the main parties involved?',
    'What action items are mentioned?',
    'What medications or dosages are mentioned?',
]

const DOC_TYPE_COLOR: Record<string, string> = {
    INVOICE: 'bg-amber-100 text-amber-700',
    CONTRACT: 'bg-blue-100 text-blue-700',
    HEALTHCARE_CLAIM: 'bg-emerald-100 text-emerald-700',
    LEGAL: 'bg-purple-100 text-purple-700',
    GENERIC: 'bg-slate-100 text-slate-700',
    UNKNOWN: 'bg-slate-100 text-slate-500',
}

export default function ChatSpace() {
    const { docId } = useParams<{ docId: string }>()
    const navigate = useNavigate()

    const [docStatus, setDocStatus] = useState<DocStatus | null>(null)
    const [extraction, setExtraction] = useState<Extraction | null>(null)
    const [fileUrl, setFileUrl] = useState<string | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        if (!docId) return []
        try {
            const saved = localStorage.getItem(MESSAGES_KEY(docId))
            return saved ? JSON.parse(saved) : []
        } catch { return [] }
    })
    const [input, setInput] = useState('')
    const [streaming, setStreaming] = useState(false)
    const [sessionId, setSessionId] = useState<string | null>(() =>
        docId ? localStorage.getItem(SESSION_KEY(docId)) : null
    )
    const [activeTab, setActiveTab] = useState<'summary' | 'findings' | 'points' | 'fields'>('summary')
    const [intelOpen, setIntelOpen] = useState(true)
    const [loadingIntel, setLoadingIntel] = useState(true)
    const [error, setError] = useState('')
    const [modelPref, setModelPref] = useState('auto')
    const [showLeaveModal, setShowLeaveModal] = useState(false)
    const [pendingNav, setPendingNav] = useState<string | null>(null)

    const messagesEndRef = useRef<HTMLDivElement>(null)

    // ── Persist messages to localStorage ──
    useEffect(() => {
        if (!docId || messages.length === 0) return
        const toSave = messages.filter(m => !m.streaming)
        localStorage.setItem(MESSAGES_KEY(docId), JSON.stringify(toSave))
    }, [messages, docId])

    // ── Persist sessionId ──
    useEffect(() => {
        if (docId && sessionId) localStorage.setItem(SESSION_KEY(docId), sessionId)
    }, [sessionId, docId])

    // ── Leave warning ──
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (messages.length > 0) {
                e.preventDefault()
                e.returnValue = ''
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [messages.length])

    useEffect(() => {
        if (!store.isAuthenticated()) navigate('/', { replace: true })
    }, [navigate])

    useEffect(() => {
        if (!docId) return
        async function load() {
            try {
                const [status, ext, file] = await Promise.allSettled([
                    getDocStatus(docId!),
                    getExtraction(docId!),
                    getFileUrl(docId!),
                ])
                if (status.status === 'fulfilled') setDocStatus(status.value)
                if (ext.status === 'fulfilled' && ext.value) setExtraction(ext.value)
                if (file.status === 'fulfilled') setFileUrl(file.value.url)
            } catch {
                setError('Failed to load document')
            } finally {
                setLoadingIntel(false)
            }
        }
        load()
    }, [docId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || streaming || !docId) return
        setInput('')
        setStreaming(true)
        const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text }
        const assistantId = crypto.randomUUID()
        setMessages(prev => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '', streaming: true }])

        try {
            for await (const event of streamChat(docId, text, sessionId, modelPref)) {
                if (event.type === 'session_id' && event.session_id) {
                    setSessionId(event.session_id)
                } else if (event.type === 'sources' && event.sources) {
                    setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, sources: event.sources } : m))
                } else if (event.type === 'token' && event.token) {
                    setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + event.token } : m))
                } else if (event.type === 'done') {
                    setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, streaming: false } : m))
                } else if (event.type === 'error') {
                    setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: `⚠️ ${event.message ?? 'Model error — try again'}`, streaming: false } : m))
                }
            }
        } catch (err: any) {
            setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: `⚠️ Error: ${err.message}`, streaming: false } : m))
        } finally {
            setStreaming(false)
        }
    }, [docId, sessionId, streaming, modelPref])

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
    }

    function handleBack() {
        if (messages.length > 0) {
            setShowLeaveModal(true)
            setPendingNav('/')
        } else {
            navigate('/')
        }
    }

    function clearAndLeave() {
        if (docId) {
            localStorage.removeItem(MESSAGES_KEY(docId))
            localStorage.removeItem(SESSION_KEY(docId))
        }
        navigate(pendingNav ?? '/')
    }

    function saveAndLeave() {
        // Messages already persisted — just navigate
        navigate(pendingNav ?? '/')
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">

            {/* LEAVE MODAL */}
            <AnimatePresence>
                {showLeaveModal && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowLeaveModal(false)} />
                        <motion.div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full z-10"
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Save className="w-6 h-6 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Save this conversation?</h3>
                            <p className="text-slate-500 text-sm text-center mb-6">
                                You have {messages.filter(m => !m.streaming).length} messages in this session.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={clearAndLeave}
                                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">
                                    Discard
                                </button>
                                <button onClick={saveAndLeave}
                                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                                    Save & Leave
                                </button>
                            </div>
                            <button onClick={() => setShowLeaveModal(false)}
                                className="w-full mt-3 py-2 text-xs text-slate-400 hover:text-slate-600">
                                Continue chatting
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TOP BAR */}
            <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4 flex-shrink-0">
                <button onClick={handleBack} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="h-4 w-px bg-slate-200" />
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">D</span>
                </div>
                <span className="font-semibold text-slate-900 text-sm">IMAGE-OCR-GPT</span>
                {docStatus && (
                    <>
                        <div className="h-4 w-px bg-slate-200" />
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DOC_TYPE_COLOR[docStatus.doc_type] ?? 'bg-slate-100 text-slate-600'}`}>
                            {docStatus.doc_type}
                        </span>
                        {docStatus.page_count && <span className="text-xs text-slate-500">{docStatus.page_count} pages</span>}
                        {docStatus.word_count && <span className="text-xs text-slate-500">· {docStatus.word_count.toLocaleString()} words</span>}
                    </>
                )}
                {messages.length > 0 && (
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                        {messages.filter(m => m.role === 'user').length} messages
                    </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">● Ready</span>
                    <span className="text-xs text-slate-400">{store.getDisplayName()}</span>
                </div>
            </div>

            {/* MAIN */}
            <div className="flex-1 flex overflow-hidden">

                {/* PDF VIEWER */}
                <div className="w-[45%] bg-slate-900 flex flex-col border-r border-slate-800 flex-shrink-0">
                    <div className="h-10 bg-slate-800 flex items-center px-4 gap-2 flex-shrink-0">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-400 text-xs font-medium">Document Viewer</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        {fileUrl ? (
                            <iframe src={fileUrl} className="w-full h-full border-0" title="Document" />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <Loader2 className="w-8 h-8 text-slate-600 animate-spin mx-auto mb-3" />
                                    <p className="text-slate-500 text-sm">Loading document...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: INTELLIGENCE + CHAT */}
                <div className="flex-1 flex flex-col overflow-hidden">

                    {/* INTELLIGENCE PANEL */}
                    <div className="border-b border-slate-200 bg-white flex-shrink-0">
                        <button onClick={() => setIntelOpen(!intelOpen)}
                            className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-semibold text-slate-900">Document Intelligence</span>
                                {extraction && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Ready</span>}
                            </div>
                            {intelOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>
                        <AnimatePresence>
                            {intelOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    {loadingIntel ? (
                                        <div className="px-5 pb-4 flex items-center gap-2 text-slate-400 text-sm">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Loading intelligence...
                                        </div>
                                    ) : !extraction ? (
                                        <div className="px-5 pb-4 text-sm text-slate-400">Processing — ask the agent anything below while it runs.</div>
                                    ) : (
                                        <div className="px-5 pb-4">
                                            <div className="flex gap-1 mb-3">
                                                {(['summary', 'findings', 'points', 'fields'] as const).map(tab => (
                                                    <button key={tab} onClick={() => setActiveTab(tab)}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                                                        {tab === 'findings' ? 'Key Findings' : tab === 'points' ? 'Key Points' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="max-h-40 overflow-y-auto pr-1">
                                                {activeTab === 'summary' && <p className="text-sm text-slate-700 leading-relaxed">{extraction.summary ?? 'No summary available.'}</p>}
                                                {activeTab === 'findings' && (
                                                    <ul className="space-y-1.5">
                                                        {(extraction.key_findings ?? []).map((f, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />{f}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                                {activeTab === 'points' && (
                                                    <ul className="space-y-1.5">
                                                        {(extraction.key_points ?? []).map((p, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />{p}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                                {activeTab === 'fields' && (extraction.extracted_json ? (
                                                    <div className="space-y-1.5">
                                                        {Object.entries(extraction.extracted_json).map(([k, v]) => {
                                                            const conf = extraction.confidence_scores?.[k]
                                                            return (
                                                                <div key={k} className="flex items-center justify-between text-sm">
                                                                    <span className="text-slate-500 font-mono text-xs">{k}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-slate-900">{String(v)}</span>
                                                                        {conf !== undefined && (
                                                                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${conf >= 0.8 ? 'bg-emerald-100 text-emerald-700' : conf >= 0.5 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                                                                {Math.round(conf * 100)}%
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                ) : <p className="text-sm text-slate-400">No schema extraction configured.</p>)}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* CHAT */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center pt-8">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <BookOpen className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <p className="text-slate-600 font-medium text-sm mb-1">Ask anything about your document</p>
                                    <p className="text-slate-400 text-xs mb-6">Groq LLaMA → Gemini → Qwen · session auto-saved</p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {SUGGESTED.map(q => (
                                            <button key={q} onClick={() => sendMessage(q)}
                                                className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 border border-indigo-100 transition-colors">
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {messages.map(msg => (
                                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className="max-w-[85%]">
                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold">D</span>
                                                </div>
                                                <span className="text-xs text-slate-400 font-medium">IMAGE-OCR-GPT</span>
                                            </div>
                                        )}
                                        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-md' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-md shadow-sm'}`}>
                                            {msg.content}
                                            {msg.streaming && <span className="inline-block w-1.5 h-4 bg-indigo-400 rounded ml-0.5 animate-pulse" />}
                                        </div>
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {msg.sources.map((s, i) => (
                                                    <span key={i} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-lg border border-slate-200">→ Page {s.page}</span>
                                                ))}
                                            </div>
                                        )}
                                        {msg.role === 'assistant' && msg.content && !msg.streaming && (
                                            <button onClick={() => navigator.clipboard.writeText(msg.content)}
                                                className="flex items-center gap-1 mt-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                                                <Copy className="w-3 h-3" /> Copy
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* INPUT */}
                        <div className="px-5 py-4 border-t border-slate-200 bg-white flex-shrink-0">
                            {error && (
                                <div className="flex items-center gap-2 text-xs text-rose-600 mb-2">
                                    <AlertTriangle className="w-3 h-3" /> {error}
                                </div>
                            )}
                            <div className="flex items-end gap-2">
                                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                                    placeholder="Ask anything... (Enter to send, Shift+Enter for newline)"
                                    rows={1}
                                    className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent max-h-32 leading-relaxed"
                                    style={{ minHeight: '48px' }}
                                    onInput={e => {
                                        const el = e.currentTarget
                                        el.style.height = 'auto'
                                        el.style.height = `${Math.min(el.scrollHeight, 128)}px`
                                    }}
                                />
                                <ModelSelector value={modelPref} onChange={setModelPref} />
                                <button onClick={() => sendMessage(input)} disabled={!input.trim() || streaming}
                                    className="w-11 h-11 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center flex-shrink-0">
                                    {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 text-center">
                                Groq LLaMA 3.3 · Gemini 1.5 Flash · Qwen 2.5 · Session auto-saved
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}