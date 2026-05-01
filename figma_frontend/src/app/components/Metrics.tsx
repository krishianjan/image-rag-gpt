import { motion } from 'framer-motion'

export default function Metrics() {
  const metrics = [
    { value: "99.9%", label: "Uptime SLA", icon: "⚡" },
    { value: "<500ms", label: "Avg Response", icon: "🚀" },
    { value: "50+", label: "Document Types", icon: "📄" },
    { value: "100k+", label: "Docs Processed", icon: "📊" },
  ]

  return (
    <section className="py-24 px-6 bg-indigo-900">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          {metrics.map((metric, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl mb-2">{metric.icon}</div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">{metric.value}</div>
              <div className="text-indigo-200">{metric.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}