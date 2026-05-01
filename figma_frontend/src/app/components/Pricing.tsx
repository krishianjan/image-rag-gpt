import { Code2, Terminal, Github } from 'lucide-react'

export default function DeveloperSection() {
  return (
    <section className="py-24 px-6 bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-indigo-600 text-white rounded-full text-xs font-semibold uppercase mb-4">
            API-First
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Built for developers
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            REST API + Webhooks + Python SDK. Open source friendly.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <Code2 className="w-5 h-5 text-indigo-400" />
              <span className="text-sm text-slate-400 ml-auto">curl example</span>
            </div>
            <pre className="text-sm text-slate-300 overflow-x-auto">
              <code>{`curl -X POST https://api.image-ocr-gpt.ai/v1/upload \\
  -H "Authorization: Bearer $YOUR_TOKEN" \\
  -F "file=@invoice.pdf"`}</code>
            </pre>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              Read the docs
            </button>
            <button className="flex items-center gap-2 px-6 py-3 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800">
              <Github className="w-5 h-5" /> GitHub
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}