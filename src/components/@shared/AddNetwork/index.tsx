import { ReactElement, ReactNode } from 'react'
import { useSwitchNetwork } from 'wagmi'
import EthIcon from '@images/eth.svg'

export interface AddNetworkProps {
  chainId: number
  networkName: string
  logo?: ReactNode
}

export default function AddNetwork({
  chainId,
  networkName,
  logo
}: AddNetworkProps): ReactElement {
  const { switchNetwork } = useSwitchNetwork({ chainId })

  return (
    <div
      className="flex items-center space-x-2 px-2 py-1.5 hover:bg-teal-50 rounded-lg transition-colors duration-200 cursor-pointer w-full text-xs font-medium text-gray-700 hover:text-teal-700"
      onClick={() => switchNetwork()}
    >
      <div className="relative w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center bg-white">
        {logo || <EthIcon className="w-3 h-3" />}
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-teal-500 rounded-full flex items-center justify-center">
          <span className="text-white text-[8px] font-bold leading-none">
            +
          </span>
        </div>
      </div>
      <span className="text-xs">
        Connect to{' '}
        <span className="font-semibold text-gray-800">{networkName}</span>
      </span>
    </div>
  )
}
