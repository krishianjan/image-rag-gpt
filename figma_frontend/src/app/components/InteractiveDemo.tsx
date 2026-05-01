import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Upload, Cloud, Loader2, CheckCircle2, XCircle, FolderOpen, Images } from 'lucide-react'
import { uploadDocument, getDocStatus } from '../lib/api'
import { store } from '../lib/store'
import AuthModal from './AuthModal'

type Phase = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

const STEPS = [
  '⬡ Initializing ParseIQ pipeline...',
  '📄 Detecting document type...',
  '🔍 Running Docling layout parser...',
  '📐 Extracting bounding boxes...',
  '🧠 Mapping TOON objects to chunks...',
  '✂️  Chunking into 512-token segments...',
  '🔗 Generating MiniLM-L6 embeddings...',
  '🌳 Building RAPTOR retrieval tree...',
  '🤖 Running Groq LLaMA extraction...',
  '✅ Validating against Pydantic schema...',
  '📊 Grounding check vs bounding boxes...',
  '🎉 Intelligence ready. Opening results...',
]

const STATUS_DONE = new Set(['READY', 'PARSED'])
const STATUS_FAIL = new Set(['FAILED'])
const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff', 'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const MAX_SIZE = 100 * 1024 * 1024

interface UploadItem {
  file: File
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error'
  docId?: string
  error?: string
  progress: number
}

export default function InteractiveDemo() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('idle')
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [multiItems, setMultiItems] = useState<UploadItem[]>([])
  const [isMultiMode, setIsMultiMode] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const multiRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startStepAnimation = useCallback(() => {
    let i = 0
    stepRef.current = setInterval(() => {
      setStepIndex(i++)
      if (i >= STEPS.length) clearInterval(stepRef.current!)
    }, 900)
  }, [])

  const startProgressAnimation = useCallback(() => {
    let p = 0
    const iv = setInterval(() => {
      p += Math.random() * 4 + 1
      setProgress(Math.min(p, 93))
      if (p >= 93) clearInterval(iv)
    }, 600)
  }, [])

  async function processSingleFile(file: File) {
    if (!store.isAuthenticated()) {
      setPendingFiles([file])
      setShowAuth(true)
      return
    }
    if (!ALLOWED_MIME.includes(file.type)) { setErrorMsg(`Unsupported: ${file.type}`); setPhase('error'); return }
    if (file.size > MAX_SIZE) { setErrorMsg('File exceeds 100MB'); setPhase('error'); return }

    setPhase('uploading'); setProgress(0); setStepIndex(0); setErrorMsg('')
    try {
      const { doc_id } = await uploadDocument(file)
      setPhase('processing')
      startStepAnimation()
      startProgressAnimation()
      pollRef.current = setInterval(async () => {
        try {
          const s = await getDocStatus(doc_id)
          if (STATUS_DONE.has(s.status)) {
            clearInterval(pollRef.current!); clearInterval(stepRef.current!)
            setProgress(100); setStepIndex(STEPS.length - 1); setPhase('done')
            setTimeout(() => navigate(`/chat/${doc_id}`), 800)
          } else if (STATUS_FAIL.has(s.status)) {
            clearInterval(pollRef.current!); clearInterval(stepRef.current!)
            setErrorMsg(s.error_message ?? 'Processing failed'); setPhase('error')
          }
        } catch { }
      }, 3000)
    } catch (err: any) { setErrorMsg(err.message ?? 'Upload failed'); setPhase('error') }
  }

  // ── MULTI-IMAGE PROCESSING ─────────────────────────────
  async function processMultipleFiles(files: File[]) {
    if (!store.isAuthenticated()) {
      setPendingFiles(files)
      setShowAuth(true)
      return
    }
    const validFiles = files.filter(f =>
      ALLOWED_MIME.includes(f.type) && f.size <= MAX_SIZE
    ).slice(0, 10) // max 10

    if (validFiles.length === 0) { setErrorMsg('No valid files'); return }

    setIsMultiMode(true)
    const items: UploadItem[] = validFiles.map(f => ({ file: f, status: 'pending', progress: 0 }))
    setMultiItems(items)

    for (let i = 0; i < items.length; i++) {
      setMultiItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'uploading' } : it))
      try {
        const { doc_id } = await uploadDocument(items[i].file)
        setMultiItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'processing', docId: doc_id, progress: 30 } : it))

        // Poll each doc
        await new Promise<void>((resolve) => {
          let ticks = 0
          const iv = setInterval(async () => {
            try {
              const s = await getDocStatus(doc_id)
              ticks++
              const p = Math.min(30 + ticks * 7, 95)
              setMultiItems(prev => prev.map((it, idx) => idx === i ? { ...it, progress: p } : it))
              if (STATUS_DONE.has(s.status)) {
                clearInterval(iv)
                setMultiItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'done', progress: 100 } : it))
                resolve()
              } else if (STATUS_FAIL.has(s.status)) {
                clearInterval(iv)
                setMultiItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'error', error: s.error_message ?? 'Failed' } : it))
                resolve()
              }
            } catch { }
          }, 3000)
        })
      } catch (err: any) {
        setMultiItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'error', error: err.message } : it))
      }
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 1) processMultipleFiles(files)
    else if (files.length === 1) processSingleFile(files[0])
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 1) processMultipleFiles(files)
    else if (files.length === 1) processSingleFile(files[0])
    e.target.value = ''
  }

  function reset() {
    if (pollRef.current) clearInterval(pollRef.current)
    if (stepRef.current) clearInterval(stepRef.current)
    setPhase('idle'); setProgress(0); setStepIndex(0); setErrorMsg('')
    setIsMultiMode(false); setMultiItems([])
  }

  const doneCount = multiItems.filter(i => i.status === 'done').length
  const firstDoneId = multiItems.find(i => i.status === 'done')?.docId

  return (
    <section id="demo" className="py-24 px-6 bg-slate-950">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-indigo-600 text-white rounded-full text-xs font-semibold uppercase mb-4">Live Demo</span>
          <h2 className="text-5xl font-bold text-white mb-4">See It Process Your Document</h2>
          <p className="text-xl text-slate-400">Drop a single file or bulk upload up to 10 images/PDFs.</p>
        </div>

        <AnimatePresence mode="wait">
          {/* IDLE */}
          {phase === 'idle' && !isMultiMode && (
            <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-2xl p-14 text-center transition-all duration-300 cursor-pointer ${dragOver ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-600 hover:border-indigo-500 hover:bg-slate-900/50'
                }`}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.tiff,.webp,.docx"
                multiple onChange={onFileInput} />
              <input ref={multiRef} type="file" className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.tiff,.webp,.docx"
                multiple onChange={onFileInput} />
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}
                className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Upload className="w-8 h-8 text-indigo-400" />
              </motion.div>
              <h3 className="text-white text-xl font-semibold mb-2">
                {dragOver ? 'Release to extract! ⚡' : 'Drop files here'}
              </h3>
              <p className="text-slate-400 mb-2">Single file or bulk upload (up to 10 files)</p>
              <p className="text-slate-500 text-sm mb-8">PDF · DOCX · PNG · JPG · TIFF · WEBP · Max 100MB each</p>
              <div className="flex flex-wrap justify-center gap-3" onClick={e => e.stopPropagation()}>
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                  <FolderOpen className="w-4 h-4" /> Single File
                </button>
                <button onClick={() => { multiRef.current?.click() }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium">
                  <Images className="w-4 h-4" /> Bulk Upload (up to 10)
                </button>
                {['Google Drive', 'Dropbox'].map(s => (
                  <button key={s} title="Coming Soon"
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-400 rounded-lg text-sm cursor-not-allowed">
                    <Cloud className="w-4 h-4" /> {s} <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">Soon</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* UPLOADING single */}
          {phase === 'uploading' && (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-slate-900 rounded-2xl p-12 text-center border border-slate-800">
              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
              <p className="text-white text-lg font-medium">Uploading to secure storage...</p>
            </motion.div>
          )}

          {/* PROCESSING single */}
          {phase === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="relative h-20 bg-slate-800 flex items-center justify-center overflow-hidden">
                <p className="text-slate-400 text-sm z-10">Analyzing document structure...</p>
                <motion.div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                  animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  style={{ boxShadow: '0 0 12px rgba(99,102,241,0.8)' }} />
              </div>
              <div className="p-8 space-y-2 font-mono text-sm min-h-[240px]">
                {STEPS.slice(0, stepIndex + 1).map((step, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: i === stepIndex ? 1 : 0.35, x: 0 }} className="text-slate-300">
                    {step}
                  </motion.div>
                ))}
              </div>
              <div className="px-8 pb-8">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Processing</span><span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full"
                    animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }}
                    style={{ boxShadow: '0 0 8px rgba(99,102,241,0.6)' }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* MULTI-IMAGE MODE */}
          {isMultiMode && (
            <motion.div key="multi" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">Bulk Processing</p>
                  <p className="text-slate-400 text-sm mt-0.5">{doneCount}/{multiItems.length} complete</p>
                </div>
                {doneCount === multiItems.length && (
                  <button onClick={() => firstDoneId && navigate(`/chat/${firstDoneId}`)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                    Open First Result →
                  </button>
                )}
              </div>
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                {multiItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {item.status === 'done' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      {item.status === 'error' && <XCircle className="w-5 h-5 text-rose-400" />}
                      {['uploading', 'processing'].includes(item.status) && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
                      {item.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-slate-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{item.file.name}</p>
                      <p className="text-xs text-slate-500">{(item.file.size / 1024).toFixed(0)}KB</p>
                    </div>
                    <div className="w-24">
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                    {item.status === 'done' && item.docId && (
                      <button onClick={() => navigate(`/chat/${item.docId}`)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex-shrink-0">
                        Chat →
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-800">
                <button onClick={reset} className="text-xs text-slate-400 hover:text-white transition-colors">
                  + Upload more files
                </button>
              </div>
            </motion.div>
          )}

          {/* DONE single */}
          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 rounded-2xl border border-emerald-500/30 p-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <p className="text-white text-xl font-semibold">Intelligence extracted!</p>
              <p className="text-slate-400 mt-2">Opening chat workspace...</p>
            </motion.div>
          )}

          {/* ERROR */}
          {phase === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-slate-900 rounded-2xl border border-rose-500/30 p-12 text-center">
              <XCircle className="w-16 h-16 text-rose-400 mx-auto mb-4" />
              <p className="text-white text-xl font-semibold mb-2">Processing failed</p>
              <p className="text-slate-400 text-sm mb-6">{errorMsg}</p>
              <button onClick={reset} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AuthModal
        open={showAuth}
        onClose={() => { setShowAuth(false); setPendingFiles([]) }}
        onSuccess={() => {
          if (pendingFiles.length > 1) processMultipleFiles(pendingFiles)
          else if (pendingFiles.length === 1) processSingleFile(pendingFiles[0])
        }}
      />
    </section>
  )
}