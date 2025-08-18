import { ReactElement } from 'react'
import { motion } from 'motion/react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import Avatar from '@components/@shared/atoms/Avatar'
import {
  IconBookmark,
  IconSwitchHorizontal,
  IconLogout
} from '@tabler/icons-react'

export default function Details(): ReactElement {
  const { address: accountId, connector: activeConnector } = useAccount()

  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  return (
    <motion.div
      className="bg-white rounded-lg border border-gray-200 shadow-lg min-w-[16rem] p-4"
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* Header */}
      <motion.div
        className="mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <h3
          className="font-bold text-lg mb-2"
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Wallet
        </h3>
      </motion.div>

      <div className="space-y-3">
        {/* Profile Link */}
        <motion.a
          href="/profile"
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-emerald-50 transition-colors duration-200 text-sm font-medium text-gray-700 hover:text-emerald-700 cursor-pointer"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Avatar accountId={accountId} />
          <span>View Profile</span>
        </motion.a>

        {/* Bookmarks Link */}
        <motion.a
          href="/bookmarks"
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-emerald-50 transition-colors duration-200 text-sm font-medium text-gray-700 hover:text-emerald-700 cursor-pointer"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <IconBookmark size={20} stroke={2.5} className="text-gray-400" />
          <span>View Bookmarks</span>
        </motion.a>

        {/* Wallet Info & Actions */}
        <motion.div
          className="border-t border-gray-100 pt-3 space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          {/* Connected Provider */}
          <div className="text-xs text-gray-500 px-2">
            Connected via{' '}
            <span className="font-medium text-gray-700">
              {activeConnector?.name}
            </span>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <motion.button
              onClick={async () => {
                connect()
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-200 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <IconSwitchHorizontal size={16} stroke={2.5} />
              <span>Switch Wallet</span>
            </motion.button>

            <motion.button
              onClick={() => {
                disconnect()
                location.reload()
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <IconLogout size={16} stroke={2.5} />
              <span>Disconnect</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
