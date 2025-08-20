import { forwardRef, FormEvent, useState } from 'react'
import { motion } from 'motion/react'
import { IconChevronDown } from '@tabler/icons-react'
import { accountTruncate } from '@utils/wallet'
import Avatar from '@shared/atoms/Avatar'
import { useAccount } from 'wagmi'
import { useModal } from 'connectkit'

// Forward ref for dropdown functionality
// eslint-disable-next-line
const Account = forwardRef<HTMLButtonElement, { onClick?: () => void }>(
  (props, ref) => {
    const { address: accountId } = useAccount()
    const { setOpen } = useModal()
    const [isHovered, setIsHovered] = useState(false)

    async function handleActivation(e: FormEvent<HTMLButtonElement>) {
      // prevent accidentally submitting a form the button might be in
      e.preventDefault()

      setOpen(true)
    }

    const handleClick = (e: FormEvent<HTMLButtonElement>) => {
      if (accountId) {
        e.preventDefault()
        props.onClick?.()
      } else {
        handleActivation(e)
      }
    }

    return accountId ? (
      <motion.button
        className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 rounded-lg border border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-teal-700 h-9 cursor-pointer"
        aria-label="Account"
        ref={ref}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Avatar accountId={accountId} />
        <span title={accountId} className="hidden 2xl:block">
          {accountTruncate(accountId)}
        </span>
        <motion.div
          animate={{ rotate: isHovered ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <IconChevronDown size={14} stroke={2.5} className="opacity-60" />
        </motion.div>
      </motion.button>
    ) : (
      <motion.button
        className="px-4 rounded-lg font-medium transition-all duration-200 text-sm h-9 flex items-center cursor-pointer"
        onClick={handleClick}
        ref={ref}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}
      >
        <span className="hidden sm:inline">Connect </span>Wallet
      </motion.button>
    )
  }
)

export default Account
