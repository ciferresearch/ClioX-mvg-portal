import { forwardRef, FormEvent } from 'react'
import Caret from '@images/caret.svg'
import { accountTruncate } from '@utils/wallet'
import Avatar from '@shared/atoms/Avatar'
import { useAccount } from 'wagmi'
import { useModal } from 'connectkit'

// Forward ref for Tippy.js
// eslint-disable-next-line
const Account = forwardRef((props, ref: any) => {
  const { address: accountId } = useAccount()
  const { setOpen } = useModal()

  async function handleActivation(e: FormEvent<HTMLButtonElement>) {
    // prevent accidentally submitting a form the button might be in
    e.preventDefault()

    setOpen(true)
  }

  return accountId ? (
    <button
      className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-teal-700"
      aria-label="Account"
      ref={ref}
      onClick={(e) => e.preventDefault()}
    >
      <Avatar accountId={accountId} />
      <span title={accountId} className="hidden sm:block">
        {accountTruncate(accountId)}
      </span>
      <Caret aria-hidden="true" className="w-4 h-4 opacity-60" />
    </button>
  ) : (
    <button
      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors duration-200 text-sm"
      onClick={(e) => handleActivation(e)}
      ref={ref}
    >
      <span className="hidden sm:inline">Connect </span>Wallet
    </button>
  )
})

export default Account
