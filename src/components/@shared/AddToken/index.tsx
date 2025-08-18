import { ReactElement, ReactNode } from 'react'
import { addTokenToWallet } from '@utils/wallet'
import OceanLogo from '@images/logo.svg'
import { useNetwork } from 'wagmi'

export interface AddTokenProps {
  address: string
  symbol: string
  decimals?: number
  logo?: {
    image?: ReactNode
    url?: string
  }
  text?: string
  className?: string
  minimal?: boolean
}

export default function AddToken({
  address,
  symbol,
  decimals,
  logo,
  text,
  className,
  minimal
}: AddTokenProps): ReactElement {
  const { chain } = useNetwork()

  async function handleAddToken() {
    if (!window?.ethereum) return

    await addTokenToWallet(address, symbol, decimals, logo?.url)
  }

  return (
    <div
      className="flex items-center space-x-2 px-2 py-1.5 hover:bg-teal-50 rounded-lg transition-colors duration-200 cursor-pointer w-full text-xs font-medium text-gray-700 hover:text-teal-700"
      onClick={handleAddToken}
    >
      <div className="relative w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center bg-white">
        {logo?.image ? (
          <div className="w-3 h-3">{logo.image}</div>
        ) : (
          <OceanLogo className="w-3 h-3" />
        )}
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white text-[8px] font-bold leading-none">
            +
          </span>
        </div>
      </div>
      <span className="text-xs">
        {text || (
          <>
            Add <span className="font-semibold text-gray-800">{symbol}</span>
            {chain && <span className="text-gray-600"> ({chain.name})</span>}
          </>
        )}
      </span>
    </div>
  )
}
