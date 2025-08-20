import { ReactElement, ReactNode, useEffect, useState } from 'react'
import External from '@images/external.svg'
import { Config } from '@oceanprotocol/lib'
import { getOceanConfig } from '@utils/ocean'

export interface ExplorerLinkProps {
  networkId: number
  path: string
  children: ReactNode
  className?: string
  variant?: 'default' | 'network-tag'
}

export default function ExplorerLink({
  networkId,
  path,
  children,
  className,
  variant = 'default'
}: ExplorerLinkProps): ReactElement {
  const [url, setUrl] = useState<string>()
  const [oceanConfig, setOceanConfig] = useState<Config>()

  useEffect(() => {
    if (!networkId) return

    const oceanConfig = getOceanConfig(networkId)
    setOceanConfig(oceanConfig)
    setUrl(oceanConfig?.explorerUri)
  }, [networkId])

  // Base style classes
  const baseClasses =
    variant === 'network-tag'
      ? 'text-teal-700 hover:text-teal-800 focus:text-teal-800 transition-colors duration-200 cursor-pointer'
      : 'text-inherit hover:text-[var(--link-font-color)] focus:text-[var(--link-font-color)] transition-colors duration-200'

  // Select different styles based on variant
  const variantClasses =
    variant === 'network-tag'
      ? 'inline-flex items-center space-x-2 px-4 py-3 bg-teal-50 rounded-xl hover:bg-teal-100 transition-all duration-200 text-sm font-medium cursor-pointer [&_*]:cursor-pointer'
      : ''

  // Icon styles
  const iconClasses =
    variant === 'network-tag'
      ? 'w-2 h-2 text-teal-700 fill-current'
      : 'w-[0.6em] h-[0.6em] inline-block fill-current'

  return (
    <a
      href={`${url}/${path}`}
      title={`View on ${oceanConfig?.explorerUri}`}
      target="_blank"
      rel="noreferrer"
      className={`${baseClasses} ${variantClasses} ${className || ''}`}
    >
      {children}
      <External className={iconClasses} />
    </a>
  )
}
