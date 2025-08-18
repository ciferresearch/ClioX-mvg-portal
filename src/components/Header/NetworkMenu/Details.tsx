import { ReactElement } from 'react'
import { motion } from 'motion/react'
import { useAccount, useNetwork } from 'wagmi'
import AddTokenList from './AddTokenList'
import { getCustomChainIds } from 'chains.config'
import AddNetwork from '@components/@shared/AddNetwork'

export default function Details(): ReactElement {
  const { connector: activeConnector } = useAccount()
  const { chains, chain: activeChain } = useNetwork()

  const networksListToDisplay = chains.filter(
    (chain) => chain.id !== activeChain?.id
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
        border: '1px solid #e5e7eb',
        boxShadow:
          '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)'
      }}
      className="p-4 min-w-[18rem] max-w-[20rem] rounded-xl"
    >
      <ul className="space-y-0">
        <motion.li
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.2 }}
          className="flex flex-col justify-between"
        >
          <div
            title="Networks"
            className="font-semibold text-sm mb-3 text-gray-800"
          >
            Networks
          </div>
          <div className="space-y-2">
            {networksListToDisplay?.length > 0 &&
              networksListToDisplay.map((chain) => {
                if (!getCustomChainIds().includes(chain.id)) return false

                return (
                  <motion.div
                    key={`add-network-button-${chain.id}`}
                    className="rounded-lg p-2 border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all duration-200 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <AddNetwork chainId={chain.id} networkName={chain.name} />
                  </motion.div>
                )
              })}
          </div>
        </motion.li>

        {activeConnector?.name === 'MetaMask' && (
          <motion.li
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.2 }}
            className="flex flex-col justify-between mt-4 pt-4 border-t border-gray-200"
          >
            <div
              title="Tokens"
              className="font-semibold text-sm mb-3 text-gray-800"
            >
              Tokens
            </div>
            <motion.div
              className="rounded-lg p-2 border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all duration-200 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <AddTokenList />
            </motion.div>
          </motion.li>
        )}
      </ul>
    </motion.div>
  )
}
