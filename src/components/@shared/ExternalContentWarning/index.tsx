import { useUserPreferences } from '@context/UserPreferences'
import { ReactElement } from 'react'
import { motion } from 'motion/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function ExternalContentWarning(): ReactElement {
  const { setAllowExternalContent } = useUserPreferences()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-sm p-3 relative overflow-hidden"
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-600 to-emerald-500" />

      {/* Content */}
      <div className="ml-2">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-2">
          <div>
            <ExclamationTriangleIcon className="w-4 h-4 text-teal-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-900">
            External content not allowed
          </h3>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 mb-3 leading-relaxed">
          The asset description may include content from external sources. Do
          you want to allow it?
        </p>

        {/* Action button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.1 }}
          onClick={() => setAllowExternalContent(true)}
          className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 text-sm flex items-center cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
        >
          Allow
        </motion.button>
      </div>
    </motion.div>
  )
}
