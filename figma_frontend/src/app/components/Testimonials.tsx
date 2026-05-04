import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, Send, User } from 'lucide-react'

interface Review {
  id: string
  name: string
  text: string
  stars: number
  date: string
}

const STORAGE_KEY = 'dm_reviews'

export default function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch { return [] }
  })
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [stars, setStars] = useState(5)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews))
  }, [reviews])

  function submitReview() {
    if (!text.trim()) return
    const review: Review = {
      id: Date.now().toString(),
      name: name.trim() || 'Anonymous',
      text: text.trim(),
      stars,
      date: new Date().toLocaleDateString()
    }
    setReviews([review, ...reviews])
    setName('')
    setText('')
    setStars(5)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <section className="py-24 px-6 bg-slate-950">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">What Users Say</h2>
          <p className="text-slate-400">Share your experience with IMAGE-OCR-GPT</p>
        </div>

        {/* Submit Review Form */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setStars(s)} className="transition-colors">
                <Star className={`w-6 h-6 ${s <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
              </button>
            ))}
          </div>
          <input
            type="text" placeholder="Your name (optional)" value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm mb-3 focus:outline-none focus:border-indigo-500"
          />
          <textarea
            placeholder="Write your review..." value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm mb-3 focus:outline-none focus:border-indigo-500 resize-none"
          />
          <button onClick={submitReview}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors">
            <Send className="w-4 h-4" /> {submitted ? 'Review Posted!' : 'Submit Review'}
          </button>
        </div>

        {/* Reviews List */}
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {reviews.length === 0 && (
            <p className="text-slate-500 text-center py-8">No reviews yet. Be the first!</p>
          )}
          {reviews.map((review) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{review.name}</p>
                  <p className="text-slate-500 text-xs">{review.date}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[...Array(review.stars)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{review.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
