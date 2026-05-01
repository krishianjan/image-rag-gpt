import { motion } from 'framer-motion';

export default function SocialProofTicker() {
  const companies = [
    'HealthTech Co',
    'LegalAI',
    'InvoiceBot',
    'EduTech',
    'MedParse',
    'ContractOS',
    'DataExtract',
    'DocuFlow',
  ];

  const stats = [
    '📄 10K docs processed today',
    '✓ 99.6% schema accuracy',
    '⚡ <30s avg processing time',
    '🌍 500+ teams using IMAGE-OCR-GPT',
    '🤖 5 AI models, zero downtime',
    '💰 $2.4M saved in manual entry',
  ];

  return (
    <div className="h-16 bg-slate-50 border-y border-slate-100 overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Row 1 - Companies (scroll left) */}
        <div className="h-8 flex items-center overflow-hidden border-b border-slate-100">
          <motion.div
            className="flex items-center gap-8 whitespace-nowrap"
            animate={{
              x: [0, -1000],
            }}
            transition={{
              duration: 35,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {[...companies, ...companies, ...companies].map((company, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-slate-300 text-sm font-medium hover:text-slate-600 transition-colors cursor-pointer">
                  {company}
                </span>
                {i < companies.length * 3 - 1 && (
                  <span className="text-indigo-400 text-xs">·</span>
                )}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Row 2 - Stats (scroll right) */}
        <div className="h-8 flex items-center overflow-hidden">
          <motion.div
            className="flex items-center gap-8 whitespace-nowrap"
            animate={{
              x: [-1000, 0],
            }}
            transition={{
              duration: 35,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {[...stats, ...stats, ...stats].map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-slate-500 text-sm">{stat}</span>
                {i < stats.length * 3 - 1 && (
                  <span className="text-indigo-400 text-xs">·</span>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
