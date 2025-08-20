import { ReactElement } from 'react'
import { motion } from 'motion/react'
import NumberUnit from './NumberUnit'
import { useProfile } from '@context/Profile'

export default function Stats(): ReactElement {
  const { assetsTotal, sales } = useProfile()

  return (
    <motion.div
      className="grid grid-cols-2 gap-6 p-6 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <NumberUnit
        label={`Sale${sales === 1 ? '' : 's'}`}
        value={typeof sales !== 'number' || sales < 0 ? 0 : sales}
      />
      <NumberUnit label="Published" value={assetsTotal} />
    </motion.div>
  )
}
