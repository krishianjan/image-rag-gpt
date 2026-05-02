import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const MODELS = [
    { id: 'auto', label: 'Auto (Best Available)', desc: 'Failover across all models' },
    { id: 'groq', label: 'Groq LLaMA 3.3 70B', desc: 'Fastest · Best quality' },
    { id: 'gemini', label: 'Gemini 1.5 Flash', desc: 'Google · Long context' },
    { id: 'qwen', label: 'Qwen 2.5 VL 3B', desc: 'OpenRouter · Vision capable' },
]

interface Props {
    value: string
    onChange: (v: string) => void
}

export default function ModelSelector({ value, onChange }: Props) {
    const [open, setOpen] = useState(false)
    const current = MODELS.find(m => m.id === value) ?? MODELS[0]

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-xs font-medium text-slate-700"
            >
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {current.label}
                <ChevronDown className="w-3 h-3" />
            </button>

            {open && (
                <div className="absolute bottom-full mb-2 left-0 bg-white border border-slate-200 rounded-xl shadow-xl w-60 overflow-hidden z-50">
                    <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase">Select AI Model</p>
                    </div>
                    {MODELS.map(m => (
                        <button
                            key={m.id}
                            onClick={() => { onChange(m.id); setOpen(false) }}
                            className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left ${value === m.id ? 'bg-indigo-50' : ''}`}
                        >
                            <div className="flex-1">
                                <p className={`text-sm font-medium ${value === m.id ? 'text-indigo-700' : 'text-slate-900'}`}>{m.label}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
                            </div>
                            {value === m.id && <span className="text-indigo-600 text-xs mt-0.5">✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}