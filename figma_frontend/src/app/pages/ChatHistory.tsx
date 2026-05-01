

import { useState, useEffect } from 'react'

import { useNavigate } from 'react-router-dom'

import { motion } from 'framer-motion'

import { ArrowLeft, Trash2, MessageSquare, Calendar, FileText } from 'lucide-react'

import { store } from '../lib/store'

interface SavedChat {

    docId: string

    lastMessage: string

    timestamp: number

    count: number

}

export default function ChatHistory() {

    const navigate = useNavigate()

    const [chats, setChats] = useState<SavedChat[]>([])

    useEffect(() => {

        if (!store.isAuthenticated()) {

            navigate('/', { replace: true })

            return

        }

        loadChats()

    }, [navigate])

    function loadChats() {

        const all: SavedChat[] = []

        for (const key in localStorage) {

            if (key.startsWith('dm_messages_')) {

                const docId = key.replace('dm_messages_', '')

                const msgs = JSON.parse(localStorage.getItem(key) || '[]')

                if (msgs.length > 0) {

                    const last = msgs[msgs.length - 1]

                    all.push({

                        docId,

                        lastMessage: last.content?.slice(0, 60) || '...',

                        timestamp: Date.now(),

                        count: msgs.length,

                    })

                }

            }

        }

        setChats(all.sort((a, b) => b.timestamp - a.timestamp))

    }

    function deleteChat(id: string) {

        localStorage.removeItem(`dm_messages_${id}`)

        localStorage.removeItem(`dm_session_${id}`)

        setChats(chats.filter(c => c.docId !== id))

    }

    return (

        <div className="h-screen flex flex-col bg-slate-50">

            <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3">

                <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm">

                    <ArrowLeft className="w-4 h-4" /> Back

                </button>

                <div className="h-4 w-px bg-slate-200" />

                <span className="font-semibold text-slate-900">IMAGE-OCR-GPT</span>

            </div>

            <div className="flex-1 overflow-y-auto p-8">

                <div className="max-w-2xl mx-auto">

                    <h1 className="text-3xl font-bold text-slate-900 mb-6">Saved Chats</h1>

                    {chats.length === 0 ? (

                        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">

                            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />

                            <p className="text-slate-500">No saved conversations yet</p>

                        </div>

                    ) : (

                        <div className="space-y-2">

                            {chats.map((chat, i) => (

                                <motion.div

                                    key={chat.docId}

                                    initial={{ opacity: 0 }}

                                    animate={{ opacity: 1 }}

                                    transition={{ delay: i * 0.05 }}

                                    className="bg-white rounded-lg border border-slate-200 p-4 hover:border-indigo-300 cursor-pointer group flex justify-between items-start"

                                    onClick={() => navigate(`/chat/${chat.docId}`)}

                                >

                                    <div className="flex-1">

                                        <p className="font-medium text-slate-900">{chat.docId.slice(0, 8)}</p>

                                        <p className="text-sm text-slate-600 mt-1">{chat.lastMessage}</p>

                                        <p className="text-xs text-slate-400 mt-2">{chat.count} messages</p>

                                    </div>

                                    <button

                                        onClick={(e) => {

                                            e.stopPropagation()

                                            deleteChat(chat.docId)

                                        }}

                                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded opacity-0 group-hover:opacity-100"

                                    >

                                        <Trash2 className="w-4 h-4" />

                                    </button>

                                </motion.div>

                            ))}

                        </div>

                    )}

                </div>

            </div>

        </div>

    )

}
