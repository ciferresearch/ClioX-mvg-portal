import { ChangeEvent, ReactElement, useState } from 'react'
import { motion } from 'motion/react'
import { useUserPreferences } from '@context/UserPreferences'
import { removeItemFromArray } from '@utils/index'
import NetworkName from '@shared/NetworkName'

export default function NetworkItem({
  chainId
}: {
  chainId: number
}): ReactElement {
  const { chainIds, setChainIds } = useUserPreferences()
  const [isHovered, setIsHovered] = useState(false)
  const [isChecked, setIsChecked] = useState(chainIds.includes(chainId))

  function handleNetworkChanged(e: ChangeEvent<HTMLInputElement>) {
    const { value } = e.target
    const valueAsNumber = Number(value)

    const newChainIds = chainIds.includes(valueAsNumber)
      ? [...removeItemFromArray(chainIds, valueAsNumber)]
      : [...chainIds, valueAsNumber]

    setChainIds(newChainIds)
    setIsChecked(!isChecked)
  }

  return (
    <motion.div
      className="relative border-b border-gray-200 dark:border-gray-600 last:border-b-0"
      whileHover={{
        backgroundColor: isChecked
          ? 'rgba(16, 185, 129, 0.1)'
          : 'rgba(0, 0, 0, 0.02)'
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <motion.label
        className="flex items-center w-full p-2.5 cursor-pointer"
        htmlFor={`opt-${chainId}`}
      >
        <motion.div
          className="relative mr-2.5 flex items-center"
          animate={{
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ duration: 0.2 }}
        >
          <input
            className="sr-only"
            id={`opt-${chainId}`}
            type="checkbox"
            name="chainIds"
            value={chainId}
            onChange={handleNetworkChanged}
            defaultChecked={chainIds.includes(chainId)}
          />

          <motion.div
            className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
              isChecked
                ? 'bg-emerald-500 border-gray-300'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
            }`}
            animate={{
              scale: isChecked ? 1.1 : 1,
              borderColor: isHovered
                ? isChecked
                  ? '#059669'
                  : '#10b981'
                : undefined
            }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              initial={false}
              animate={{
                opacity: isChecked ? 1 : 0,
                scale: isChecked ? 1 : 0.5,
                rotate: isChecked ? 0 : 180
              }}
              transition={{
                duration: 0.2,
                type: 'spring',
                stiffness: 500,
                damping: 30
              }}
            >
              <svg
                className="w-2 h-2 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          className={`text-xs font-medium transition-all duration-200 flex items-center ${
            isChecked
              ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
              : 'text-gray-700 dark:text-gray-300'
          }`}
          animate={{
            color: isHovered ? (isChecked ? '#047857' : '#059669') : undefined,
            x: isHovered ? 2 : 0
          }}
          transition={{ duration: 0.2 }}
        >
          <NetworkName networkId={chainId} />
        </motion.div>

        {isChecked && (
          <motion.div
            className="ml-auto"
            initial={{ opacity: 0, scale: 0, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0, rotate: 90 }}
            transition={{
              duration: 0.3,
              type: 'spring',
              stiffness: 400,
              damping: 25
            }}
          >
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </motion.div>
        )}
      </motion.label>
    </motion.div>
  )
}
