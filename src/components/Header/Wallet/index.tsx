import { ReactElement } from 'react'
import Account from './Account'
import Details from './Details'
import Tooltip from '@shared/atoms/Tooltip'
import { useAccount } from 'wagmi'

export default function Wallet(): ReactElement {
  const { address: accountId } = useAccount()

  return (
    <div className="relative">
      <Tooltip
        content={<Details />}
        trigger="click focus mouseenter"
        disabled={!accountId}
      >
        <Account />
      </Tooltip>
    </div>
  )
}
