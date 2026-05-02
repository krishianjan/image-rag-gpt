import { useState, useRef, useCallback } from 'react'
import { uploadDocument, getDocStatus } from '../lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Upload, Cloud, Loader2, CheckCircle2, XCircle, FolderOpen, Images } from 'lucide-react'

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

export default function InteractiveDemo() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('idle')
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const multiRef = useRef<HTMLInputElement>(null)

  const startStepAnimation = useCallback(() => {
    let i = 0
    const iv = setInterval(() => {
      setStepIndex(i++)
      if (i >= STEPS.length) clearInterval(iv)
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
    setPhase('uploading')
    setProgress(0)
    setStepIndex(0)
    setErrorMsg('')

    try {
      const data = await uploadDocument(file)
      const doc_id = data.doc_id

      setPhase('processing')
      startStepAnimation()
      startProgressAnimation()

      const pollInterval = setInterval(async () => {
        try {
          const s = await getDocStatus(doc_id)
          if (s.status === 'READY' || s.status === 'PARSED') {
            clearInterval(pollInterval)
            setProgress(100)
            setStepIndex(STEPS.length - 1)
            setPhase('done')
            navigate(`/chat/${doc_id}`)
          } else if (s.status === 'FAILED') {
            clearInterval(pollInterval)
            setErrorMsg(s.error_message ?? 'Processing failed')
            setPhase('error')
          }
        } catch { }
      }, 3000)
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Upload failed')
      setPhase('error')
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 1) processSingleFile(files[0])
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 1) processSingleFile(files[0])
    e.target.value = ''
  }

  function reset() {
    setPhase('idle')
    setProgress(0)
    setStepIndex(0)
    setErrorMsg('')
  }

  return (
    <section id="demo" className="py-24 px-6 bg-slate-950">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-indigo-600 text-white rounded-full text-xs font-semibold uppercase mb-4">Live Demo</span>
          <h2 className="text-5xl font-bold text-white mb-4">See It Process Your Document</h2>
          <p className="text-xl text-slate-400">Drop a single file or bulk upload up to 10 images/PDFs.</p>
        </div>

        <AnimatePresence mode="wait">
          {phase === 'idle' && (
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
                onChange={onFileInput} />
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
                {['Google Drive', 'Dropbox', 'URL'].map(s => (
                  <button key={s} title="Coming Soon"
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-400 rounded-lg text-sm cursor-not-allowed">
                    <Cloud className="w-4 h-4" /> {s} <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">Soon</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {phase === 'uploading' && (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-slate-900 rounded-2xl p-12 text-center border border-slate-800">
              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
              <p className="text-white text-lg font-medium">Uploading to secure storage...</p>
            </motion.div>
          )}

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

          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 rounded-2xl border border-emerald-500/30 p-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <p className="text-white text-xl font-semibold">Intelligence extracted!</p>
              <p className="text-slate-400 mt-2">Opening chat workspace...</p>
            </motion.div>
          )}

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
    </section>
  )
}
