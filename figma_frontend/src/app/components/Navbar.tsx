import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X, Clock, Brain } from 'lucide-react'
import { store } from '../lib/store'

export default function Navbar() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const isAuth = store.isAuthenticated()

  function handleSignOut() {
    store.signOut()
    navigate('/', { replace: true })
  }

  return (
    <nav className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0">
      {/* Logo with animated brain icon */}
      <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
        <div className="relative">
          {/* Glow effect behind the icon */}
          <div className="absolute inset-0 bg-indigo-400 rounded-md blur-md opacity-60 group-hover:opacity-100 transition-all duration-300 animate-pulse" />
          {/* Gradient background */}
          <div className="relative w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-md flex items-center justify-center shadow-md shadow-indigo-500/40">
            <Brain className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-200" />
          </div>
        </div>
        <div>
          <span className="font-bold text-slate-900">IMAGE - RAG GPT</span>
          <span className="hidden md:inline-block text-xs text-slate-400 ml-1.5 font-normal">for OCR's & Docs</span>
        </div>
      </div>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-6 ml-12 flex-1">
        <a href="#how-it-works" className="text-sm text-slate-600 hover:text-slate-900">How It Works</a>
        <a href="#use-cases" className="text-sm text-slate-600 hover:text-slate-900">Use Cases</a>
        <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900">Pricing</a>
        <a href="#api" className="text-sm text-slate-600 hover:text-slate-900">API</a>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {isAuth && (
          <>
            <button
              onClick={() => navigate('/history')}
              className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
            >
              <Clock className="w-4 h-4" />
              History
            </button>
            <button
              onClick={handleSignOut}
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign Out
            </button>
          </>
        )}
        {!isAuth && (
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            Sign In
          </button>
        )}

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-slate-600 hover:text-slate-900"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-slate-200 p-4 md:hidden">
          <div className="space-y-2">
            <a href="#how-it-works" className="block text-sm text-slate-600 hover:text-slate-900 p-2">How It Works</a>
            <a href="#use-cases" className="block text-sm text-slate-600 hover:text-slate-900 p-2">Use Cases</a>
            <a href="#pricing" className="block text-sm text-slate-600 hover:text-slate-900 p-2">Pricing</a>
            <a href="#api" className="block text-sm text-slate-600 hover:text-slate-900 p-2">API</a>
          </div>
        </div>
      )}
    </nav>
  )
}