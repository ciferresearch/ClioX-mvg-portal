import { ReactElement } from 'react'
import { motion } from 'framer-motion'
import Compute from '@images/compute.svg'
import Download from '@images/download.svg'
import Lock from '@images/lock.svg'
import Saas from '@images/saas.svg'

export default function AssetType({
  type,
  accessType,
  className
}: {
  type: string
  accessType: string
  className?: string
}): ReactElement {
  const iconClasses =
    'w-3 h-3 inline-block align-baseline -mb-0.5 fill-current mr-2'

  const labelClasses = (isFirst = false, isSaas = false) =>
    `inline-block uppercase text-[10px] ${
      isFirst || isSaas ? '' : 'border-l border-gray-300 pl-2 ml-2'
    }`

  return (
    <motion.div
      className={className || ''}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {accessType === 'access' ? (
        <Download role="img" aria-label="Download" className={iconClasses} />
      ) : accessType === 'saas' ? (
        <Saas
          role="img"
          aria-label="Software as a Service"
          className={iconClasses}
        />
      ) : accessType === 'compute' && type === 'algorithm' ? (
        <Lock role="img" aria-label="Private" className={iconClasses} />
      ) : (
        <Compute role="img" aria-label="Compute" className={iconClasses} />
      )}

      <span className={labelClasses(true)}>
        {accessType === 'saas'
          ? null
          : accessType === 'access'
          ? 'download'
          : 'compute'}
      </span>

      <span className={labelClasses(false, accessType === 'saas')}>
        {type === 'dataset'
          ? 'dataset'
          : type === 'saas'
          ? 'saas'
          : 'algorithm'}
      </span>
    </motion.div>
  )
}
