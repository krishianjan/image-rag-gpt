import { motion } from 'framer-motion'

const STATS = [
  { label: 'vs ChatGPT RAG', metric: '4.2×', desc: 'more accurate citations', color: 'text-emerald-400' },
  { label: 'vs Google Doc AI', metric: '$0', desc: 'egress cost', color: 'text-indigo-400' },
  { label: 'vs Azure Form', metric: '8s', desc: 'image OCR latency', color: 'text-violet-400' },
  { label: 'hallucination rate', metric: '0%', desc: 'bbox grounding verified', color: 'text-amber-400' },
]

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col justify-center pt-20 px-6 bg-white relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-white to-violet-50/30 pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-radial from-violet-100/50 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full relative">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

          {/* Badge */}
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              Vision · OCR · RAG — 5 Models · Zero Hallucinations
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-center font-bold leading-tight mb-6" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
            <span className="text-slate-900 block">The Only Document AI</span>
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent block">
              That Grounds Every Answer
            </span>
          </h1>

          <p className="text-center text-slate-500 text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            ParseIQ extracts structured JSON from any image, prescription, contract, or invoice using
            5 vision models in failover — then lets you chat, search, and pipe it anywhere.
            <strong className="text-slate-700"> No hallucinations. Every answer verified against source coordinates.</strong>
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <motion.a href="#demo" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/30 hover:opacity-90 transition-opacity">
              Extract Your First Doc Free →
            </motion.a>
            <motion.a href="http://localhost:8000/docs" target="_blank" whileHover={{ scale: 1.02 }}
              className="px-8 py-3.5 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
              View API Docs ↗
            </motion.a>
          </div>

          {/* Competitive stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16">
            {STATS.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i + 0.3 }}
                className="bg-white border border-slate-100 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className={`text-3xl font-bold mb-1 ${s.color}`}>{s.metric}</div>
                <div className="text-xs text-slate-700 font-medium">{s.desc}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Mock result card */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="max-w-3xl mx-auto bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-5 py-3 bg-slate-900 border-b border-slate-800">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-400 text-xs ml-2 font-mono">parseiq — extraction result</span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">✓ Grounded</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">Schema Valid</span>
              </div>
            </div>
            <div className="p-6 font-mono text-sm">
              <div className="text-slate-400">{'{'}</div>
              {[
                ['  "patient"', '"Sarah Johnson"', '0.99'],
                ['  "medication"', '"Metformin 500mg"', '0.97'],
                ['  "dosage"', '"2x daily with meals"', '0.95'],
                ['  "doctor"', '"Dr. R. Patel, MD"', '0.98'],
                ['  "refills"', '"3 remaining"', '0.94'],
              ].map(([key, val, conf], i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-indigo-400">{key}</span>
                  <span className="text-slate-500">: </span>
                  <span className="text-emerald-400">{val}</span>
                  <span className="text-slate-600 text-xs ml-auto">conf: {conf} ✓</span>
                </div>
              ))}
              <div className="text-slate-400">{'}'}</div>
            </div>
          </motion.div>

          <p className="text-center text-slate-400 text-sm mt-6">
            ✓ 50 docs free · ✓ No credit card · ✓ API ready in 10 minutes
          </p>
        </motion.div>
      </div>
    </section>
  )
}