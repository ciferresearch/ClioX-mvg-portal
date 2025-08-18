import { ReactElement } from 'react'
import { motion } from 'motion/react'
import { accountTruncate } from '../../../../@utils/wallet'
import { useAutomation } from '../../../../@context/Automation/AutomationProvider'
import { useUserPreferences } from '../../../../@context/UserPreferences'
import Copy from '../../../@shared/atoms/Copy'
import Cross from '@images/cross.svg'
import Button from '../../../@shared/atoms/Button'

export default function Address({
  showDelete
}: {
  showDelete: boolean
}): ReactElement {
  const { autoWalletAddress } = useAutomation()
  const { setAutomationWalletJSON } = useUserPreferences()

  return (
    <motion.div
      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{
        borderColor: '#10b981',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
      }}
    >
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Address:
        </span>
        <motion.strong
          className="text-sm font-mono text-gray-800 dark:text-gray-200"
          whileHover={{ color: '#059669' }}
        >
          {accountTruncate(autoWalletAddress)}
        </motion.strong>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Copy text={autoWalletAddress} />
        </motion.div>
      </motion.div>

      {showDelete && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => setAutomationWalletJSON(undefined)}
            title="Delete"
            style="text"
            size="small"
            className="text-red-500 hover:text-red-600 p-1 rounded"
          >
            <Cross className="w-3 h-3" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
