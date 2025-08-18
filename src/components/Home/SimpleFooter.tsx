export default function SimpleFooter() {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    { label: 'Documentation', href: '/docs' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Imprint', href: '/imprint' },
    { label: 'Cookie Settings', href: '#cookies' }
  ]

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

  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Brand and description */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              {brandIcon}
              <span className="font-bold text-gray-900 text-lg">
                MY Data Platform
              </span>
            </div>
            <p className="text-gray-600 max-w-md mx-auto lg:mx-0 leading-relaxed text-sm">
              Transforming healthcare through ethical AI and privacy-preserving
              analytics. Expert care powered by multi-omic data insights.
            </p>
          </div>

          {/* Right side - Links and copyright */}
          <div className="text-center lg:text-right">
            {/* Links */}
            <div className="flex flex-wrap justify-center lg:justify-end gap-6 mb-6">
              {footerLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-gray-600 hover:text-teal-600 transition-colors duration-200 text-sm font-medium"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Copyright */}
            <div className="text-gray-500 text-xs">
              <p>© {currentYear} ClioX. All rights reserved.</p>
              <p className="mt-1">
                Built by{' '}
                <a
                  href="https://delta-dao.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:text-teal-700 font-medium transition-colors duration-200"
                >
                  deltaDAO
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
