export default function AIModels() {
  const models = [
    { name: "Groq LLaMA 3.3 70B", provider: "Groq", speed: "200+ tok/s", status: "active" },
    { name: "Gemini 1.5 Flash", provider: "Google", speed: "Fast", status: "active" },
    { name: "Qwen 2.5 VL", provider: "OpenRouter", speed: "Balanced", status: "active" },
    { name: "Mistral (coming)", provider: "Mistral AI", speed: "Coming soon", status: "soon" },
  ]

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold uppercase mb-4">
            Multi-Model Intelligence
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            5 AI Models. Zero Downtime.
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            When one model hits its limit, the next takes over automatically.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {models.map((model, idx) => (
            <div key={idx} className="p-6 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-2 h-2 rounded-full ${model.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                <span className="text-xs text-slate-500">{model.provider}</span>
              </div>
              <div className="font-semibold text-slate-900 mb-1">{model.name}</div>
              <div className="text-sm text-slate-600">{model.speed}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-700">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Auto-failover enabled • Rate limit 429 → next model
          </div>
        </div>
      </div>
    </section>
  )
}