import { useState, useEffect } from 'react'
import { motion } from 'motion/react'

export default function FloatingHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight
      setIsScrolled(window.scrollY > heroHeight * 0.5)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const brandIcon = (
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-sm">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-5 h-5 text-white"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M7 12a5 5 0 1 1 10 0v3a3 3 0 0 1-3 3h-1a1 1 0 0 1-1-1v-9" />
        <circle cx="7" cy="12" r="2" fill="currentColor" />
      </svg>
    </div>
  )

  const menuIcon = (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 6h16M4 12h16M4 18h12" />
    </svg>
  )

  const navLinks = [
    { label: 'Catalogue', href: '#catalogue' },
    { label: 'Publish', href: '#publish' },
    { label: 'Verify', href: '#verify' },
    { label: 'Partners', href: '#partners' },
    { label: 'Resources', href: '#resources' }
  ]

  return (
    <>
      <div className="fixed inset-x-0 top-4 flex justify-center pointer-events-none z-50">
        <motion.div
          className={`w-full max-w-4xl mx-4 h-15 bg-white border rounded-3xl shadow-lg flex items-center justify-between px-4 pointer-events-auto transition-all duration-300 ${
            isScrolled
              ? 'shadow-xl border-gray-200 transform -translate-y-1'
              : 'shadow-md border-gray-100'
          }`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Brand */}
          <div className="flex items-center gap-3">
            {brandIcon}
            <span className="font-bold text-gray-900 text-lg">
              MY Data Platform
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3 py-2 rounded-lg text-gray-700 font-medium text-sm hover:bg-teal-50 hover:text-teal-700 transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors"
            aria-label="Toggle menu"
          >
            {menuIcon}
          </button>
        </motion.div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-20 flex justify-center pointer-events-none z-40 lg:hidden">
          <motion.div
            className="w-full max-w-4xl mx-4 bg-white border border-gray-100 rounded-xl shadow-lg pointer-events-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <nav className="flex flex-col p-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-3 rounded-lg text-gray-700 font-medium hover:bg-teal-50 hover:text-teal-700 transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </motion.div>
        </div>
      )}

      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
