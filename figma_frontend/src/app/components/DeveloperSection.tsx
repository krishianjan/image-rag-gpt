import { useState, useEffect } from 'react'
import { Code2, Terminal, Zap, Shield, GitBranch, Globe, Cpu, Database } from 'lucide-react'

export default function DeveloperSection() {
  const features = [
    { icon: <Code2 className="w-5 h-5" />, title: "REST + GraphQL", desc: "Standard JSON over HTTP, with GraphQL coming soon." },
    { icon: <Terminal className="w-5 h-5" />, title: "Python SDK & CLI", desc: "pip install image-gpt – process docs in three lines." },
    { icon: <Zap className="w-5 h-5" />, title: "<500ms latency", desc: "Groq inference + edge caching." },
    { icon: <Shield className="w-5 h-5" />, title: "Enterprise SSO", desc: "SAML, OIDC, audit logs." },
    { icon: <GitBranch className="w-5 h-5" />, title: "Webhooks", desc: "Real‑time notifications on job completion." },
    { icon: <Globe className="w-5 h-5" />, title: "Cloud / On‑prem", desc: "Deploy in your VPC or use our managed cloud." },
    { icon: <Cpu className="w-5 h-5" />, title: "Custom Models", desc: "Bring your own fine‑tuned LLM." },
    { icon: <Database className="w-5 h-5" />, title: "Vector DB agnostic", desc: "pgvector, Pinecone, Weaviate." },
  ]

  return (
    <section id="api" className="py-24 px-6 bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-indigo-600 text-white rounded-full text-xs font-semibold uppercase mb-4">
            API‑First. Open Source Friendly.
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Built for developers, by developers.
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Integrate document intelligence into your stack in minutes, not months.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((f, i) => (
            <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-indigo-500/50 transition-all">
              <div className="text-indigo-400 mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold mb-1">{f.title}</h3>
              <p className="text-slate-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono text-slate-400">Quick start</span>
          </div>
          <pre className="text-sm text-slate-300 overflow-x-auto p-4 bg-slate-950 rounded-lg">
            <code>{`pip install image-gpt-ocr

from image_gpt import ImageGPT

client = ImageGPT(api_key="your_key")
result = client.extract("invoice.pdf", schema="invoice_v1")
print(result.json())`}</code>
          </pre>
          <div className="flex justify-center gap-4 mt-6">
            <a href="https://github.com/yourusername/image-gpt" target="_blank" className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Code2 className="w-4 h-4" /> GitHub
            </a>
            <a href="http://localhost:8000/docs" target="_blank" className="flex items-center gap-2 px-5 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700">
              <Terminal className="w-4 h-4" /> API Docs
            </a>
          </div>
        </div>

        {/* Live Comments Section */}
        <div className="mt-20 bg-slate-800/30 rounded-2xl p-8 border border-slate-700">
          <h3 className="text-xl font-semibold text-white text-center mb-6">⚡ Live Developer Feedback</h3>
          <LiveComments />
        </div>
      </div>
    </section>
  )
}

// LiveComments component with correct imports
function LiveComments() {
  const [comments, setComments] = useState<Array<{ id: number, user: string, text: string, time: Date }>>([])
  const [newComment, setNewComment] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    // Simulate fetching recent comments – replace with real API later
    const mock = [
      { id: 1, user: "@dev_explorer", text: "Best OCR API I've ever used. Handles handwriting like magic.", time: new Date() },
      { id: 2, user: "@ml_engineer", text: "RAPTOR retrieval is a game changer for RAG.", time: new Date() },
    ]
    setComments(mock)
  }, [])

  const addComment = () => {
    if (!newComment.trim()) return
    const comment = {
      id: Date.now(),
      user: userName.trim() || "anonymous",
      text: newComment.trim(),
      time: new Date()
    }
    setComments(prev => [comment, ...prev])
    setNewComment('')
    // Optionally POST to backend (we'll add later)
  }

  return (
    <div>
      <div className="mb-6 space-y-4 max-h-64 overflow-y-auto">
        {comments.map(c => (
          <div key={c.id} className="bg-slate-900 rounded-lg p-3 border-l-4 border-indigo-500">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span className="font-mono">{c.user}</span>
              <span>{c.time.toLocaleTimeString()}</span>
            </div>
            <p className="text-slate-300 text-sm">{c.text}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" placeholder="Your name (optional)" value={userName} onChange={e => setUserName(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white w-1/3" />
        <input type="text" placeholder="Leave a review or rating..." value={newComment} onChange={e => setNewComment(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white flex-1" />
        <button onClick={addComment} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm">Post</button>
      </div>
    </div>
  )
}