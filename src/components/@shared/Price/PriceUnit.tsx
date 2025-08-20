import { ReactElement } from 'react'
import { motion } from 'framer-motion'
import { useUserPreferences } from '@context/UserPreferences'
import { formatNumber } from '@utils/numbers'

export default function PriceUnit({
  price,
  className,
  size = 'small',
  symbol,
  decimals,
  explicitZero
}: {
  price: number
  className?: string
  size?: 'small' | 'mini' | 'large'
  symbol?: string
  decimals?: string
  explicitZero?: boolean
}): ReactElement {
  const { locale } = useUserPreferences()

  const sizeClasses = {
    large: 'text-lg font-bold',
    small: 'text-base font-bold',
    mini: 'text-sm font-bold'
  }

  const symbolSizeClasses = {
    large: 'text-base',
    small: 'text-sm',
    mini: 'text-xs'
  }

  const symbolColor = 'text-emerald-700'

  return (
    <motion.div
      className={`
        inline-block leading-tight
        ${sizeClasses[size]} 
        text-gray-700
        ${className || ''}
      `}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {price === 0 && !explicitZero ? (
        <div className="whitespace-nowrap">Free</div>
      ) : (!price && price !== 0) || Number.isNaN(price) ? (
        <div className="whitespace-nowrap">-</div>
      ) : (
        <div className="whitespace-nowrap">
          {Number.isNaN(price) ? '-' : formatNumber(price, locale, decimals)}{' '}
          <span
            className={`
            font-normal ${symbolSizeClasses[size]} ${symbolColor}
          `}
          >
            {symbol}
          </span>
        </div>
      )}
    </motion.div>
  )
}
