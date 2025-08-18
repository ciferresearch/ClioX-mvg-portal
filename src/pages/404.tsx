import { ReactElement } from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Page404(): ReactElement {
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
        {/* 404 Number */}
        <motion.div
          className="relative mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600 leading-none">
            404
          </h1>
          {/* Floating Elements */}
          <motion.div
            className="absolute -top-4 -right-4 w-6 h-6 bg-emerald-400 rounded-full"
            animate={{
              y: [0, -10, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <motion.div
            className="absolute -bottom-4 -left-4 w-4 h-4 bg-teal-400 rounded-full"
            animate={{
              y: [0, 8, 0],
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

        {/* Error Message */}
        <motion.div
          className="max-w-2xl mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            Oops! Page not found
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 leading-relaxed">
            The page you&apos;re looking for seems to have wandered off into the
            digital wilderness. Don&apos;t worry, we&apos;ll help you find your
            way back.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 mb-12"
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

          <Link
            href="/search"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-teal-200 text-teal-700 font-semibold rounded-xl hover:bg-teal-50 hover:border-teal-300 transition-all duration-200 cursor-pointer group"
          >
            <span>Browse Catalogue</span>
            <motion.svg
              className="ml-2 w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ rotate: 0 }}
              whileHover={{ rotate: 15 }}
              transition={{ duration: 0.2 }}
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </motion.svg>
          </Link>
        </motion.div>
      </div>

      {/* Bottom Decoration */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-teal-100/20 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
      />
    </div>
  )
}
