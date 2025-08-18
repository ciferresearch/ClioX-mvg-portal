import { ReactElement, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import {
  AUTOMATION_MODES,
  useAutomation
} from '../../../../@context/Automation/AutomationProvider'
import { useMarketMetadata } from '../../../../@context/MarketMetadata'
import { useUserPreferences } from '../../../../@context/UserPreferences'
import Button from '../../../@shared/atoms/Button'
import Balance from './Balance'

import Import from './Import'
import Address from './Address'
import Decrypt from './Decrypt'

function AdvancedView(): ReactElement {
  const { deleteCurrentAutomationWallet } = useAutomation()

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
    >
      <Balance />

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={() => deleteCurrentAutomationWallet()}
          className="w-full text-center bg-red-500 hover:bg-red-600 text-white rounded-lg py-1.5 px-3 text-sm"
        >
          Delete Wallet
        </Button>
      </motion.div>
    </motion.div>
  )
}

function SimpleView({
  isFunded,
  roughTxCountEstimate
}: {
  isFunded: boolean
  roughTxCountEstimate?: number
}): ReactElement {
  return (
    <motion.div
      className="w-full text-center p-3 rounded-lg border"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      style={{
        background: isFunded
          ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
          : 'linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)',
        borderColor: isFunded ? '#10b981' : '#ef4444'
      }}
    >
      {isFunded && roughTxCountEstimate && roughTxCountEstimate > 0 ? (
        <motion.span
          className="block text-sm font-medium text-emerald-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Automation available for roughly {roughTxCountEstimate.toFixed(0)}{' '}
          transactions.
        </motion.span>
      ) : (
        <motion.span
          className="block text-sm font-medium text-red-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Automation not sufficiently funded!
        </motion.span>
      )}
    </motion.div>
  )
}

export default function Details({
  isFunded
}: {
  isFunded: boolean
}): ReactElement {
  const {
    autoWallet,
    autoWalletAddress,
    balance,
    isAutomationEnabled,
    isLoading,
    hasValidEncryptedWallet,
    setIsAutomationEnabled
  } = useAutomation()

  const { automationConfig } = useMarketMetadata().appConfig
  const { automationWalletMode } = useUserPreferences()

  const [roughTxCountEstimate, setRoughTxCountEstimate] = useState<number>()
  const [needsImport, setNeedsImport] = useState<boolean>(
    !hasValidEncryptedWallet
  )

  useEffect(() => {
    setNeedsImport(!hasValidEncryptedWallet)
  }, [hasValidEncryptedWallet])

  useEffect(() => {
    if (!automationConfig.roughTxGasEstimate) return
    setRoughTxCountEstimate(
      Number(balance.native.balance) / automationConfig.roughTxGasEstimate
    )
  }, [balance.native, automationConfig?.roughTxGasEstimate])

  return (
    <div className="max-w-md p-4">
      {/* DESCRIPTION */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-2"
      >
        <h3
          className="font-bold text-lg mb-2"
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 2px 4px rgba(5, 150, 105, 0.1)'
          }}
        >
          Automation
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Automate transactions using an imported wallet of your choice.
        </p>
      </motion.div>

      {/* EN-/DISABLE */}
      {autoWallet?.address && (
        <motion.div
          className="mb-3"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <button
              onClick={() => {
                setIsAutomationEnabled(!isAutomationEnabled)
              }}
              className="w-full rounded-lg py-1 px-3 text-sm font-medium transition-all duration-200"
              style={{
                background: isAutomationEnabled
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                boxShadow: isAutomationEnabled
                  ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                  : '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              {isAutomationEnabled ? 'Disable automation' : 'Enable automation'}
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* AUTOMATION ADDRESS */}
      {autoWalletAddress && (
        <motion.div
          className="mb-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <Address showDelete={autoWallet === undefined && !isLoading} />
        </motion.div>
      )}

      {/* MAIN AUTOMATION SECTION */}
      {autoWallet && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {automationWalletMode === AUTOMATION_MODES.SIMPLE ? (
            <SimpleView
              isFunded={isFunded}
              roughTxCountEstimate={roughTxCountEstimate}
            />
          ) : (
            <AdvancedView />
          )}
        </motion.div>
      )}

      {/* IMPORT / EXPORT */}
      {!autoWallet && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          {needsImport ? <Import /> : <Decrypt />}
        </motion.div>
      )}
    </div>
  )
}
