import { ReactElement, ReactNode } from 'react'
import { useSwitchNetwork } from 'wagmi'
import Button from '@shared/atoms/Button'
import styles from './index.module.css'
import EthIcon from '@images/eth.svg'
import AddTokenStyles from '../AddToken/index.module.css'

/**
 * TEMP_DISABLE_TESTNET
 * The optional `disabled` prop is used by callers to temporarily disable
 * certain network entries in the UI (e.g., Pontus‑X Testnet while CORS is broken).
 * To re‑enable, stop passing `disabled` from callers and remove this prop if desired.
 */
export interface AddNetworkProps {
  chainId: number
  networkName: string
  logo?: ReactNode
  disabled?: boolean
}

export default function AddNetwork({
  chainId,
  networkName,
  logo,
  disabled
}: AddNetworkProps): ReactElement {
  const { switchNetwork } = useSwitchNetwork({ chainId })

  return (
    <Button
      className={AddTokenStyles.button}
      style="text"
      size="small"
      onClick={(e) => {
        if (disabled) return
        switchNetwork()
      }}
      disabled={disabled}
      aria-disabled={disabled}
      title={disabled ? 'Temporarily disabled' : undefined}
    >
      <span className={AddTokenStyles.logoWrap}>
        <div className={styles.logo}>{logo || <EthIcon />}</div>
      </span>

      <span className={AddTokenStyles.text}>
        {'Connect to '}
        <span className={`${AddTokenStyles.symbol} ${styles.networkName}`}>
          {networkName}
        </span>
      </span>
    </Button>
  )
}
