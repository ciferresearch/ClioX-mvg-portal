import { ReactElement, useState } from 'react'
import { motion } from 'motion/react'
import { IconInfoCircle } from '@tabler/icons-react'
import { useUserPreferences } from '@context/UserPreferences'

export default function ExternalContent(): ReactElement {
  const { allowExternalContent, setAllowExternalContent } = useUserPreferences()
  const [showTooltip, setShowTooltip] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <motion.label
        className="flex items-center cursor-pointer flex-1"
        whileTap={{ scale: 0.98 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.input
          type="checkbox"
          checked={allowExternalContent === true}
          onChange={() => setAllowExternalContent(!allowExternalContent)}
          className="sr-only"
        />
        <motion.div
          className={`w-4 h-4 rounded border-2 flex items-center justify-center mr-3 transition-all duration-200 ${
            allowExternalContent
              ? 'bg-emerald-500 border-gray-300'
              : 'bg-white border-gray-300'
          }`}
          animate={{
            scale: allowExternalContent ? 1.1 : 1,
            borderColor: isHovered
              ? allowExternalContent
                ? '#059669'
                : '#10b981'
              : undefined
          }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            initial={false}
            animate={{
              opacity: allowExternalContent ? 1 : 0,
              scale: allowExternalContent ? 1 : 0.5,
              rotate: allowExternalContent ? 0 : 180
            }}
            transition={{
              duration: 0.2,
              type: 'spring',
              stiffness: 500,
              damping: 30
            }}
          >
            <svg
              className="w-2.5 h-2.5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
        </motion.div>
        <span className="text-sm font-medium text-gray-800">
          External Content
        </span>
      </motion.label>

      {/* Info Icon with Tooltip */}
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
          <IconInfoCircle
            className="w-4 h-4 text-gray-400 hover:text-emerald-500 cursor-help transition-colors duration-200"
            stroke={2.5}
          />
        </motion.div>

        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute right-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50"
            style={{ pointerEvents: 'none' }}
          >
            Load content from external sources in the assets&apos; description.
            <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
