import { ReactElement, useEffect, useState } from 'react'
import Network from './Network'
import Details from './Details'
import Tooltip from '@shared/atoms/Tooltip'
import styles from './index.module.css'
import { useNetwork } from 'wagmi'

export default function NetworkMenu(): ReactElement {
  const { chain } = useNetwork()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Defer rendering until after mount to avoid SSR/CSR mismatch
  if (!mounted || !chain?.id) return null

  return (
    <div className={styles.networkMenu}>
      <Tooltip content={<Details />} trigger="click focus mouseenter">
        <Network />
      </Tooltip>
    </div>
  )
}
