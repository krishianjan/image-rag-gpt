import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, User, Sparkles } from 'lucide-react'
import { createTenant, fetchToken } from '../lib/api'
import { store } from '../lib/store'

interface Props {
    open: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function AuthModal({ open, onClose, onSuccess }: Props) {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return
        setLoading(true)
        setError('')
        try {
            const tenant = await createTenant(name.trim())
            const { access_token } = await fetchToken(tenant.id)
            store.setToken(access_token)
            store.setTenantId(tenant.id)
            store.setDisplayName(name.trim())
            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.message ?? 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 z-10"
                        initial={{ scale: 0.92, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Get Started Free</h2>
                                <p className="text-sm text-slate-500">No credit card required</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Your Name or Team Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Krishi's Team"
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                                        autoFocus
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !name.trim()}
                                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating workspace...
                                    </>
                                ) : (
                                    'Start Extracting Free →'
                                )}
                            </button>
                        </form>

                        <p className="text-xs text-slate-400 text-center mt-4">
                            By continuing you agree to our Terms of Service. Your data stays private.
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}