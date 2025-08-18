import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import loadable from '@loadable/component'
import Networks from './UserPreferences/Networks'
import NetworkMenu from './NetworkMenu'
import SearchButton from './SearchButton'
import SearchBar from './SearchBar'
import UserPreferences from './UserPreferences'
import Automation from './UserPreferences/Automation'
import { useMarketMetadata } from '@context/MarketMetadata'

const Wallet = loadable(() => import('./Wallet'))

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { appConfig } = useMarketMetadata()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
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

  const mainNavLinks = [
    { label: 'Catalogue', href: '/search?sort=nft.created&sortOrder=desc' },
    { label: 'Publish', href: '/publish/1' },
    { label: 'Verify', href: '/verify' },
    { label: 'Partners', href: '/partners' },
    { label: 'Resources', href: '/resources' }
  ]

  return (
    <>
      {/* SearchBar - positioned below the header */}
      <div className="fixed inset-x-0 top-20 flex justify-center pointer-events-none z-40">
        <div className="w-full max-w-2xl mx-4 pointer-events-auto">
          <SearchBar placeholder="Search for service offerings" />
        </div>
      </div>

      <div className="fixed inset-x-0 top-4 flex justify-center pointer-events-none z-50">
        <motion.div
          className={`max-w-fit mx-4 bg-white border rounded-3xl shadow-lg flex items-center px-4 py-2 pointer-events-auto transition-all duration-300 ${
            isScrolled
              ? 'shadow-xl border-gray-200 transform -translate-y-1'
              : 'shadow-md border-gray-100'
          }`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            {brandIcon}
            <span className="font-bold text-gray-900 text-lg">
              MY Data Platform
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1 ml-6">
            {mainNavLinks.map((link) => {
              const isActive =
                router.pathname === link.href ||
                (link.href.startsWith('/search') &&
                  router.pathname.startsWith('/search'))
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`px-3 h-9 flex items-center rounded-lg font-medium text-sm transition-colors duration-200 mx-1 ${
                    isActive
                      ? 'bg-teal-100 text-teal-700'
                      : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2 ml-6">
            <SearchButton />
            {appConfig?.chainIdsSupported?.length > 1 && <Networks />}
            <NetworkMenu />
            <Wallet />
            {appConfig?.automationConfig?.enableAutomation === 'true' && (
              <Automation />
            )}
            <UserPreferences />
          </div>

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
            className="max-w-md w-full mx-4 bg-white border border-gray-100 rounded-xl shadow-lg pointer-events-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4">
              {/* Mobile Navigation Links */}
              <nav className="flex flex-col gap-2 mb-4">
                {mainNavLinks.map((link) => {
                  const isActive =
                    router.pathname === link.href ||
                    (link.href.startsWith('/search') &&
                      router.pathname.startsWith('/search'))
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                        isActive
                          ? 'bg-teal-100 text-teal-700'
                          : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </nav>

              {/* Mobile Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
                <SearchButton />
                {appConfig?.chainIdsSupported?.length > 1 && <Networks />}
                <NetworkMenu />
                <Wallet />
                {appConfig?.automationConfig?.enableAutomation === 'true' && (
                  <Automation />
                )}
                <UserPreferences />
              </div>
            </div>
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
