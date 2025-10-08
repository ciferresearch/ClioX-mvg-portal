import { ChangeEvent, ReactElement } from 'react'
import { useUserPreferences } from '@context/UserPreferences'
import { removeItemFromArray } from '@utils/index'
import NetworkName from '@shared/NetworkName'
import styles from './NetworkItem.module.css'

export default function NetworkItem({
  chainId
}: {
  chainId: number
}): ReactElement {
  const { chainIds, setChainIds } = useUserPreferences()
  /*
   * TEMP_DISABLE_TESTNET (RE-ENABLED)
   * Testnet (chainId 32457) is now re-enabled. Leaving this switch in place
   * for quick toggling if needed again; keep it `false` to allow selection.
   */
  const isDisabled = false

  function handleNetworkChanged(e: ChangeEvent<HTMLInputElement>) {
    if (isDisabled) return
    const { value } = e.target

    // storing all chainId everywhere as a number so convert from here
    const valueAsNumber = Number(value)

    const newChainIds = chainIds.includes(valueAsNumber)
      ? [...removeItemFromArray(chainIds, valueAsNumber)]
      : [...chainIds, valueAsNumber]
    setChainIds(newChainIds)
  }

  return (
    <div className={styles.radioWrap} key={chainId}>
      <label
        className={`${styles.radioLabel} ${isDisabled ? styles.disabled : ''}`}
        htmlFor={`opt-${chainId}`}
      >
        <input
          className={styles.input}
          id={`opt-${chainId}`}
          type="checkbox"
          name="chainIds"
          value={chainId}
          onChange={handleNetworkChanged}
          defaultChecked={chainIds.includes(chainId)}
        />
        <NetworkName key={chainId} networkId={chainId} />
      </label>
    </div>
  )
}
