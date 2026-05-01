import { useState } from 'react';
import { motion } from 'framer-motion';

interface CardData {
  emoji: string;
  stat: string;
  problem: string;
  solution: string;
}

const problems: CardData[] = [
  {
    emoji: '🏥',
    stat: '3 Hours',
    problem: 'Doctor spends 3 hours manually entering 40 prescriptions into the system daily.',
    solution: 'IMAGE-OCR-GPT extracts all prescription data in under 2 minutes with 99%+ accuracy.',
  },
  {
    emoji: '⚖️',
    stat: '$800',
    problem: 'Founder pays lawyer $800 to review a 200-page contract over 3 days.',
    solution:
      'IMAGE-OCR-GPT parses contracts instantly, highlighting key clauses and risks — cuts review time to 1 hour.',
  },
  {
    emoji: '💻',
    stat: '$160',
    problem: 'Developer burns $160 in GPT-4V image tokens processing a single textbook.',
    solution:
      'IMAGE-OCR-GPT uses efficient multi-model routing — same job costs $0.30 with better accuracy.',
  },
  {
    emoji: '🧾',
    stat: '$180K/yr',
    problem: 'Startup pays 3 ops staff $180K/year to manually process 50K invoices.',
    solution:
      'IMAGE-OCR-GPT automates invoice extraction end-to-end — reduces ops team to 1 person.',
  },
];

function FlipCard({ card }: { card: CardData }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="relative h-80 cursor-pointer"
      style={{ perspective: '1000px' }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        whileHover={{ scale: 1.02 }}
      >
        {/* Front */}
        <motion.div
          className="absolute inset-0 bg-white border border-slate-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center"
          style={{ backfaceVisibility: 'hidden' }}
          whileHover={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)' }}
        >
          <motion.div
            className="text-6xl mb-6"
            animate={isFlipped ? {} : { y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {card.emoji}
          </motion.div>
          <div className="text-5xl font-bold text-rose-600 mb-4">{card.stat}</div>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">{card.problem}</p>
          <p className="text-slate-400 text-xs">Hover to see solution →</p>
        </motion.div>

        {/* Back */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          whileHover={{ boxShadow: '0 20px 60px rgba(79, 70, 229, 0.2)' }}
        >
          <p className="text-indigo-600 font-bold text-xs uppercase mb-4">IMAGE-OCR-GPT fixes this:</p>
          <p className="text-slate-800 text-sm leading-relaxed mb-6">{card.solution}</p>
          <motion.a
            href="#demo"
            className="text-indigo-600 font-medium text-sm px-4 py-2 border border-indigo-300 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            → Try it now
          </motion.a>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function ProblemSection() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-xs font-semibold uppercase mb-4">
            The Problem
          </div>
          <h2 className="text-5xl font-bold text-slate-900 mb-4">
            The World Runs on Documents.
          </h2>
          <p className="text-xl text-slate-500">
            And wastes billions of hours processing them manually.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {problems.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <FlipCard card={card} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
