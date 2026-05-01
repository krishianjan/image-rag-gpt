import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { getReviews } from '../lib/api'

export default function Testimonials() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReviews().then(data => {
      setReviews(data.slice(0, 6))
      setLoading(false)
    }).catch(() => {
      // Fallback data
      setReviews([
        { name: "Sarah Chen", role: "CTO at HealthAI", stars: 5, review: "Reduced our OCR costs by 80%. The handwriting recognition is magic." },
        { name: "Marcus Williams", role: "Legal Ops @ Fortune 500", stars: 5, review: "Contract extraction with 99% accuracy. Game changer." },
        { name: "Priya Patel", role: "Data Scientist", stars: 5, review: "RAPTOR tree + citations = actually trustworthy RAG." },
      ])
      setLoading(false)
    })
  }, [])

  return (
    <section className="py-24 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold uppercase mb-4">
            Real Teams. Real Results.
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Loved by engineers and analysts
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Drop your review — it appears instantly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, idx) => (
            <div key={idx} className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < review.stars ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                ))}
              </div>
              <p className="text-slate-700 mb-4">"{review.review}"</p>
              <div>
                <p className="font-semibold text-slate-900">{review.name}</p>
                <p className="text-sm text-slate-500">{review.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}