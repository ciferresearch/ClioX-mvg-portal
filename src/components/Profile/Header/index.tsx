import { ReactElement } from 'react'
import { motion } from 'motion/react'
import Stats from './Stats'
import Account from './Account'
import Button from '../../@shared/atoms/Button'
import { useAutomation } from '../../../@context/Automation/AutomationProvider'

export default function AccountHeader({
  accountId
}: {
  accountId: string
}): ReactElement {
  const { autoWalletAddress } = useAutomation()

  return (
    <motion.div
      className="bg-white border border-gray-100 rounded-3xl shadow-lg p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <Account accountId={accountId} />
          <div className="mt-8">
            <Stats />
          </div>
        </div>

        {autoWalletAddress && autoWalletAddress !== accountId && (
          <motion.div
            className="lg:w-48 flex justify-center lg:justify-end"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Button
              style="outline"
              to={`/profile/${autoWalletAddress}`}
              className="bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100 hover:border-teal-300 hover:text-teal-800 transition-all duration-200"
            >
              View Automation Account
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
