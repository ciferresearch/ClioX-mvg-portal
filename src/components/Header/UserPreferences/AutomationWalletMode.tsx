import { ReactElement, useState } from 'react'
import { motion } from 'motion/react'
import { IconInfoCircle } from '@tabler/icons-react'
import { useUserPreferences } from '@context/UserPreferences'
import { AUTOMATION_MODES } from '../../../@context/Automation/AutomationProvider'

export default function AutomationWalletMode(): ReactElement {
  const { automationWalletMode, setAutomationWalletMode } = useUserPreferences()
  const [showTooltip, setShowTooltip] = useState(false)

  const handleModeChange = (mode: AUTOMATION_MODES) => {
    setAutomationWalletMode(mode)
  }

  return (
    <motion.div
      className="p-3 rounded-lg border border-gray-200 bg-gray-50"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with Title and Info Icon */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-800">
          Automation Wallet Mode
        </h4>

        {/* Info Icon with Tooltip */}
        <div
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
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
              Set the viewing mode for your automation wallet
              <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Button Group */}
      <div className="flex gap-2">
        {/* Advanced Button */}
        <motion.button
          onClick={() => handleModeChange(AUTOMATION_MODES.ADVANCED)}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
            automationWalletMode === AUTOMATION_MODES.ADVANCED
              ? 'bg-emerald-500 text-white border-emerald-500'
              : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-300 hover:bg-emerald-50'
          } border`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            boxShadow:
              automationWalletMode === AUTOMATION_MODES.ADVANCED
                ? '0 2px 8px rgba(16, 185, 129, 0.2)'
                : '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        >
          <motion.span
            animate={{
              color:
                automationWalletMode === AUTOMATION_MODES.ADVANCED
                  ? '#ffffff'
                  : '#374151'
            }}
            transition={{ duration: 0.2 }}
          >
            Advanced
          </motion.span>
        </motion.button>

        {/* Simple Button */}
        <motion.button
          onClick={() => handleModeChange(AUTOMATION_MODES.SIMPLE)}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
            automationWalletMode === AUTOMATION_MODES.SIMPLE
              ? 'bg-emerald-500 text-white border-emerald-500'
              : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-300 hover:bg-emerald-50'
          } border`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            boxShadow:
              automationWalletMode === AUTOMATION_MODES.SIMPLE
                ? '0 2px 8px rgba(16, 185, 129, 0.2)'
                : '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        >
          <motion.span
            animate={{
              color:
                automationWalletMode === AUTOMATION_MODES.SIMPLE
                  ? '#ffffff'
                  : '#374151'
            }}
            transition={{ duration: 0.2 }}
          >
            Simple
          </motion.span>
        </motion.button>
      </div>
    </motion.div>
  )
}
