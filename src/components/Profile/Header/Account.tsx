import { ReactElement } from 'react'
import { motion } from 'motion/react'
import { useUserPreferences } from '@context/UserPreferences'
import ExplorerLink from '@shared/ExplorerLink'
import NetworkName from '@shared/NetworkName'
import Copy from '@shared/atoms/Copy'
import Avatar from '@shared/atoms/Avatar'
import { accountTruncate } from '@utils/wallet'
import { useAutomation } from '../../../@context/Automation/AutomationProvider'
import Transaction from '../../../@images/transaction.svg'
import { useAddressConfig } from '@hooks/useAddressConfig'
import { IconUser, IconExternalLink } from '@tabler/icons-react'

export default function Account({
  accountId
}: {
  accountId: string
}): ReactElement {
  const { chainIds } = useUserPreferences()
  const { autoWalletAddress } = useAutomation()
  const { verifiedAddresses } = useAddressConfig()

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
      {/* Avatar Section */}
      <div className="relative">
        {accountId ? (
          <Avatar
            accountId={accountId}
            className="w-32 h-32 rounded-full shadow-lg"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg">
            <IconUser className="w-16 h-16 text-white" />
          </div>
        )}

        {autoWalletAddress === accountId && (
          <motion.div
            className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Transaction className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 text-center lg:text-left space-y-4">
        <motion.h3
          className="text-3xl font-bold text-gray-900"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {verifiedAddresses?.[accountId] || accountTruncate(accountId)}
        </motion.h3>

        {accountId && (
          <motion.div
            className="flex items-center justify-center lg:justify-start space-x-2 text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-xl font-mono max-w-md mx-auto lg:mx-0"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <span className="truncate">{accountId}</span>
            <Copy text={accountId} />
          </motion.div>
        )}

        <motion.div
          className="flex flex-wrap justify-center lg:justify-start gap-3 cursor-pointer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          {accountId &&
            chainIds.map((value) => (
              <ExplorerLink
                key={value}
                networkId={value}
                path={`address/${accountId}`}
                variant="network-tag"
              >
                <NetworkName networkId={value} />
              </ExplorerLink>
            ))}
        </motion.div>
      </div>
    </div>
  )
}
