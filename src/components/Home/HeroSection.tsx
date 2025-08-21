import { motion } from 'motion/react'
import { useRouter } from 'next/router'

export default function HeroSection() {
  const router = useRouter()

  const handleGetStarted = () => {
    router.push('/search?sort=nft.created&sortOrder=desc')
  }

  const handleExploreSolution = () => {
    router.push('/resources')
  }

  return (
    <section className="min-h-screen grid lg:grid-cols-2 overflow-hidden">
      {/* Left Side - Content */}
      <div className="bg-teal-800 flex items-center justify-center px-8 lg:px-16 py-20 lg:py-0 order-2 lg:order-1">
        <div className="max-w-2xl">
          <motion.h1
            className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            Get multi-omic data insights through{' '}
            <span className="text-emerald-300">ethical</span> AI
          </motion.h1>

          <motion.p
            className="text-xl text-emerald-50 mb-8 leading-relaxed max-w-lg"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
          >
            Expert care powered by privacy-preserving analytics.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          >
            <button
              onClick={handleGetStarted}
              className="bg-white text-teal-800 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
            >
              Get started
            </button>
            <button
              onClick={handleExploreSolution}
              className="border-2 border-white/40 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all duration-200 cursor-pointer"
            >
              Explore our solution
            </button>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="relative min-h-[50vh] lg:min-h-screen order-1 lg:order-2 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/Health/health_hero.jpg')`
          }}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          whileHover={{ scale: 1.05 }}
        >
          {/* Overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-800/10 via-teal-700/5 to-teal-600/5" />
        </motion.div>
      </div>
    </section>
  )
}
