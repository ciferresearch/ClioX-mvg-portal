import { ReactElement, useState } from 'react'
import { motion } from 'motion/react'
import Status from '@shared/atoms/Status'

import Tooltip from '@shared/atoms/Tooltip'
import NetworkName from '@shared/NetworkName'
import { NetworkIcon } from '../NetworkIcon'
import { IconChevronDown } from '@tabler/icons-react'
import { useNetwork } from 'wagmi'
import useNetworkMetadata, {
  getNetworkDataById,
  getNetworkDisplayName
} from '@hooks/useNetworkMetadata'

export default function Network({
  onClick
}: {
  onClick?: () => void
}): ReactElement {
  const { chain } = useNetwork()
  const { isTestnet, isSupportedOceanNetwork, networksList } =
    useNetworkMetadata()
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    onClick?.()
  }

  return chain?.id ? (
    <motion.button
      className="flex items-center space-x-1 2xl:space-x-2 px-2 2xl:px-3 rounded-lg border border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-emerald-700 whitespace-nowrap cursor-pointer flex-shrink-0 h-9"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
      }}
    >
      {!isSupportedOceanNetwork && (
        <Tooltip content="No Ocean Protocol contracts are deployed to this network.">
          <Status state="error" />
        </Tooltip>
      )}
      <div className="flex items-center space-x-1">
        {/* Show larger icon for screens smaller than 2xl */}
        <div className="block 2xl:hidden">
          <NetworkIcon
            name={getNetworkDisplayName(
              getNetworkDataById(networksList, chain.id)
            )}
          />
        </div>
        {/* Show full NetworkName component for 2xl and above */}
        <div className="hidden 2xl:block">
          <NetworkName networkId={chain.id} minimal />
        </div>
        {isTestnet && (
          <div className="hidden 2xl:block text-[10px] leading-none px-1 py-1 bg-emerald-100 text-emerald-700 rounded-md font-medium flex items-center justify-center h-4">
            TEST
          </div>
        )}
      </div>
      <motion.div
        animate={{ rotate: isHovered ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <IconChevronDown
          size={14}
          stroke={2.5}
          className="text-gray-400 transition-colors duration-300"
        />
      </motion.div>
    </motion.button>
  ) : null
}
