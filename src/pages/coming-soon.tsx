import { ReactElement } from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function ComingSoon(): ReactElement {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 -mt-24">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-100/30 to-emerald-100/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-100/30 to-teal-100/30 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Coming Soon Icon */}
        <motion.div
          className="relative mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="w-32 h-32 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl mb-6">
            <motion.svg
              className="w-16 h-16 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ rotate: -90 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </motion.svg>
          </div>

          {/* Floating Elements */}
          <motion.div
            className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-400 rounded-full"
            animate={{
              y: [0, -8, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <motion.div
            className="absolute -bottom-2 -left-2 w-3 h-3 bg-teal-400 rounded-full"
            animate={{
              y: [0, 6, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5
            }}
          />
        </motion.div>

        {/* Main Text */}
        <motion.div
          className="max-w-2xl mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600 leading-tight mb-6">
            Coming Soon
          </h1>
          <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-6 leading-tight">
            Under Development
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 leading-relaxed">
            This feature is currently being developed and will be available in
            the near future. We appreciate your patience as we work to improve
            your experience.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex justify-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
          >
            <span>Return to Homepage</span>
            <motion.svg
              className="ml-2 w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ x: 0 }}
              whileHover={{ x: 3 }}
              transition={{ duration: 0.2 }}
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </motion.svg>
          </Link>
        </motion.div>
      </div>

      {/* Bottom Decoration */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-teal-100/20 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1, ease: 'easeOut' }}
      />
    </div>
  )
}
