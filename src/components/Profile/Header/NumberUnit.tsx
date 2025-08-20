import { ReactElement } from 'react'
import { motion } from 'motion/react'
import Markdown from '@shared/Markdown'
import Tooltip from '@shared/atoms/Tooltip'

interface NumberUnitProps {
  label: string | ReactElement
  value: number | string | Element | ReactElement
  small?: boolean
  icon?: Element | ReactElement
  tooltip?: string
}

export default function NumberUnit({
  small,
  label,
  value,
  icon,
  tooltip
}: NumberUnitProps): ReactElement {
  return (
    <motion.div
      className="text-center"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className={`text-3xl font-bold text-teal-800 mb-2 ${
          small ? 'text-2xl' : ''
        }`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {icon && icon}
        {value}
      </motion.div>

      <motion.span
        className="text-sm font-medium text-gray-600 block"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {label}{' '}
        {tooltip && (
          <Tooltip
            content={<Markdown text={tooltip} />}
            className="inline-block ml-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          />
        )}
      </motion.span>
    </motion.div>
  )
}
