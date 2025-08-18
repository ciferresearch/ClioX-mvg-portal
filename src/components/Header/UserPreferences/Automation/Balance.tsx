import { ReactElement } from 'react'
import { motion } from 'motion/react'
import { useAutomation } from '../../../../@context/Automation/AutomationProvider'

export default function Balance(): ReactElement {
  const { balance } = useAutomation()

  return (
    <motion.div
      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{
        borderColor: '#10b981',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
      }}
    >
      <motion.h4
        className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        Balance
      </motion.h4>

      <motion.ul className="space-y-2">
        {balance.native && (
          <motion.li
            key={`automation-balance-${balance.native.symbol}`}
            className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded border"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {balance.native.symbol}:
            </span>
            <span className="text-xs font-mono text-gray-800 dark:text-gray-200">
              {Number(balance.native.balance).toFixed(4)}
            </span>
          </motion.li>
        )}

        {balance.approved &&
          Object.keys(balance.approved).map((currency, index) => (
            <motion.li
              key={`automation-balance-${currency}`}
              className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded border"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {currency}:
              </span>
              <span className="text-xs font-mono text-gray-800 dark:text-gray-200">
                {Number(balance.approved[currency]).toFixed(4)}
              </span>
            </motion.li>
          ))}
      </motion.ul>
    </motion.div>
  )
}
