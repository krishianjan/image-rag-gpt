export default function UseCasesSection() {
  const useCases = [
    { industry: "Healthcare", use: "Prescription OCR", icon: "🏥", count: "3,200+" },
    { industry: "Legal", use: "Contract extraction", icon: "⚖️", count: "1,800+" },
    { industry: "Finance", use: "Invoice processing", icon: "💰", count: "4,500+" },
    { industry: "Education", use: "Chat with textbooks", icon: "📚", count: "12,000+" },
    { industry: "Real Estate", use: "Lease analysis", icon: "🏠", count: "900+" },
    { industry: "Insurance", use: "Claim automation", icon: "🛡️", count: "2,100+" },
  ]

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold uppercase mb-4">
            One Platform. Every Industry.
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            100+ ways teams use IMAGE-OCR-GPT daily.
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            From healthcare to finance, we power document intelligence at scale.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((item, idx) => (
            <div key={idx} className="group p-6 bg-slate-50 rounded-2xl hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">{item.icon}</div>
              <div className="text-sm text-indigo-600 font-semibold mb-1">{item.industry}</div>
              <div className="text-lg font-semibold text-slate-900 mb-2">{item.use}</div>
              <div className="text-slate-500 text-sm">{item.count} teams</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}