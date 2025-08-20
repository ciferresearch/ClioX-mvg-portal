import { ReactElement } from 'react'
import useNetworkMetadata, {
  getNetworkDataById,
  getNetworkDisplayName
} from '@hooks/useNetworkMetadata'
import { NetworkIcon } from './NetworkIcon'

export default function NetworkName({
  networkId,
  minimal,
  className
}: {
  networkId: number
  minimal?: boolean
  className?: string
}): ReactElement {
  const { networksList } = useNetworkMetadata()
  const networkData = getNetworkDataById(networksList, networkId)
  const networkName = getNetworkDisplayName(networkData)

  return (
    <span
      className={`
        inline-flex items-center cursor-default capitalize
        ${minimal ? 'relative' : ''}
        ${className || ''}
      `}
      title={networkName}
    >
      <NetworkIcon name={networkName} />
      <span
        className={`
        ${minimal ? 'opacity-0 w-0 lg:opacity-100 lg:w-auto' : ''}
        transition-all duration-200
      `}
      >
        {networkName}
      </span>
    </span>
  )
}
