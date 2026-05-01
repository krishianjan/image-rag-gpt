import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import SocialProofTicker from '../components/SocialProofTicker'
import ProblemSection from '../components/ProblemSection'
import InteractiveDemo from '../components/InteractiveDemo'
import UseCasesSection from '../components/UseCasesSection'
import HowItWorks from '../components/HowItWorks'
import AIModels from '../components/AIModels'
import Metrics from '../components/Metrics'
import Testimonials from '../components/Testimonials'
import Pricing from '../components/Pricing'
import DeveloperSection from '../components/DeveloperSection'
import FinalCTA from '../components/FinalCTA'
import Footer from '../components/Footer'
import SkeletonLoader from '../components/SkeletonLoader'

export default function LandingPage() {
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval)
                    setTimeout(() => setLoading(false), 300)
                    return 100
                }
                return prev + 10
            })
        }, 100)
        return () => clearInterval(interval)
    }, [])

    return (
        <AnimatePresence mode="wait">
            {loading ? (
                <motion.div
                    key="loader"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-white"
                >
                    <SkeletonLoader />
                    <div className="fixed bottom-0 left-0 right-0 h-1 bg-slate-100">
                        <motion.div
                            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400"
                            initial={{ width: '0%' }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="min-h-screen bg-white overflow-x-hidden"
                >
                    <Navbar />
                    <Hero />
                    <SocialProofTicker />
                    <ProblemSection />
                    <InteractiveDemo />
                    <UseCasesSection />
                    <HowItWorks />
                    <AIModels />
                    <Metrics />
                    <Testimonials />
                    <Pricing />
                    <DeveloperSection />
                    <FinalCTA />
                    <Footer />
                </motion.div>
            )}
        </AnimatePresence>
    )
}