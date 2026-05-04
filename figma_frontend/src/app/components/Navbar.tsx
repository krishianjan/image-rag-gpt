import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Menu, X, Clock } from 'lucide-react'

export default function Navbar() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-400 rounded-md blur-md opacity-60 group-hover:opacity-100 transition-all duration-300 animate-pulse" />
          <div className="relative w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-md flex items-center justify-center shadow-md shadow-indigo-500/40">
            <Brain className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-200" />
          </div>
        </div>
        <div>
          <span className="font-bold text-slate-900">IMAGE - RAG GPT</span>
          <span className="hidden md:inline-block text-xs text-slate-400 ml-1.5 font-normal">for OCR's & Docs</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-6 ml-12 flex-1">
        <a href="#demo" className="text-sm text-slate-600 hover:text-slate-900">Demo</a>
        <a href="#how-it-works" className="text-sm text-slate-600 hover:text-slate-900">How It Works</a>
        <a href="#use-cases" className="text-sm text-slate-600 hover:text-slate-900">Use Cases</a>
        <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900">Pricing</a>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <a
          href="https://calendar.app.google/pbSiQdBVy3tnyzZZ9"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium hidden md:block"
        >
          Book Demo
        </a>

        <button
          onClick={() => document.getElementById('demo')?.scrollIntoView({behavior: 'smooth'})}
          className="text-sm px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-md shadow-indigo-500/20"
        >
          Try Free Now
        </button>

        <button
          onClick={() => navigate('/history')}
          className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <Clock className="w-4 h-4" />
          History
        </button>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-slate-600 hover:text-slate-900"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-slate-200 p-4 md:hidden">
          <div className="flex flex-col gap-3">
            <a href="#demo" className="text-sm text-slate-600">Demo</a>
            <a href="#how-it-works" className="text-sm text-slate-600">How It Works</a>
            <a href="#use-cases" className="text-sm text-slate-600">Use Cases</a>
            <a href="#pricing" className="text-sm text-slate-600">Pricing</a>
            <a href="https://calendar.app.google/pbSiQdBVy3tnyzZZ9" target="_blank" className="text-sm text-indigo-600 font-medium">Book Demo</a>
          </div>
        </div>
      )}
    </nav>
  )
}
