export default function HowItWorks() {
  const steps = [
    { number: "01", title: "Upload", desc: "PDF, DOCX, images, or handwritten scans", icon: "📤" },
    { number: "02", title: "Parse", desc: "Docling extracts layout + bounding boxes", icon: "🔍" },
    { number: "03", title: "Embed", desc: "MiniLM + RAPTOR hierarchical tree", icon: "🧠" },
    { number: "04", title: "Extract", desc: "Schema-driven JSON with grounding", icon: "📊" },
  ]

  return (
    <section className="py-24 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold uppercase mb-4">
            From Chaos to Structure
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            In 4 Simple Steps
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="text-center">
              <div className="text-5xl mb-4">{step.icon}</div>
              <div className="text-indigo-600 font-mono text-sm mb-2">{step.number}</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-slate-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}