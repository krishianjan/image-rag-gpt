import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Trash2, MessageSquare, Calendar, FileText } from 'lucide-react'
import { store } from '../lib/store'

interface SavedChat {
    docId: string
    docName: string
    lastMessage: string
    timestamp: number
    messageCount: number
}

export default function ChatHistory() {
    const navigate = useNavigate()
    const [chats, setChats] = useState<SavedChat[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {

        // Load all saved chat sessions from localStorage
        const allChats: SavedChat[] = []
        for (const key in localStorage) {
            if (key.startsWith('dm_messages_')) {
                const docId = key.replace('dm_messages_', '')
                try {
                    const messages = JSON.parse(localStorage.getItem(key) || '[]')
                    if (messages.length > 0) {
                        const lastMsg = [...messages].reverse().find((m: any) => m.content)
                        allChats.push({
                            docId,
                            docName: `Document ${docId.slice(0, 8)}...`,
                            lastMessage: lastMsg?.content.slice(0, 60) || 'No messages',
                            timestamp: parseInt(localStorage.getItem(`dm_session_${docId}`) || '0') || Date.now(),
                            messageCount: messages.length,
                        })
                    }
                } catch (e) {
                    console.error('Failed to load chat:', e)
                }
            }
        }

        // Sort by timestamp descending
        allChats.sort((a, b) => b.timestamp - a.timestamp)
        setChats(allChats)
        setLoading(false)
    }, [navigate])

    function deleteChat(docId: string) {
        localStorage.removeItem(`dm_messages_${docId}`)
        localStorage.removeItem(`dm_session_${docId}`)
        setChats(chats.filter(c => c.docId !== docId))
    }

    function formatDate(timestamp: number) {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))

        if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        if (days === 1) return 'Yesterday'
        if (days < 7) return `${days} days ago`
        return date.toLocaleDateString()
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
            {/* TOP BAR */}
            <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="h-4 w-px bg-slate-200" />
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">I</span>
                </div>
                <span className="font-semibold text-slate-900 text-sm">IMAGE-OCR-GPT</span>
                <span className="text-xs text-slate-400 ml-auto">{store.getDisplayName()}</span>
            </div>

            {/* MAIN */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-slate-900 mb-2">Chat History</h1>
                        <p className="text-slate-500">{chats.length} saved conversation{chats.length !== 1 ? 's' : ''}</p>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-slate-500">Loading chats...</p>
                        </div>
                    ) : chats.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 mb-1">No saved conversations yet</p>
                            <p className="text-slate-400 text-sm">Upload a document and start chatting to save conversations here</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {chats.map((chat, i) => (
                                <motion.div
                                    key={chat.docId}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                                    onClick={() => navigate(`/chat/${chat.docId}`)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                <h3 className="font-semibold text-slate-900 truncate">{chat.docName}</h3>
                                                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full ml-auto flex-shrink-0">
                                                    {chat.messageCount} msg{chat.messageCount !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 text-sm truncate mb-2">{chat.lastMessage}</p>
                                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(chat.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                deleteChat(chat.docId)
                                            }}
                                            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete chat"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}