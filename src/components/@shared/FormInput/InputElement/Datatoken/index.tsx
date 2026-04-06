import { useField, useFormikContext } from 'formik'
import { ReactElement, useEffect, useState, useRef } from 'react'
import { InputProps } from '@shared/FormInput'
import Key from '@images/key.svg'
import styles from './index.module.css'
import { generateDtName } from '@oceanprotocol/lib'
import { FormPublishData } from '@components/Publish/_types'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const SYMBOL_PRESETS = [
  { label: 'GXAT (Default)', name: 'Access Token', symbol: 'GXAT' },
  { label: 'CLIOX', name: 'Access Token', symbol: 'CLIOX' }
]

export default function Datatoken({
  randomize,
  ...props
}: InputProps & { randomize?: boolean }): ReactElement {
  const [field, meta, helpers] = useField(props?.name)
  const { values } = useFormikContext<FormPublishData>()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  async function generateName() {
    const datatokenOptions = randomize
      ? generateDtName()
      : { name: 'Access Token', symbol: 'GXAT' }
    helpers.setValue({ ...datatokenOptions })
  }

  useEffect(() => {
    if (field.value?.name !== '') return
    generateName()
  }, [field.value?.name])

  // Auto-switch symbol based on provider
  useEffect(() => {
    const providerUrl = values?.services?.[0]?.providerUrl?.url || ''
    if (providerUrl.includes('agrospai.udl.cat')) {
      helpers.setValue({ name: 'Access Token', symbol: 'CLIOX' })
    } else {
      helpers.setValue({ name: 'Access Token', symbol: 'GXAT' })
    }
  }, [values?.services?.[0]?.providerUrl?.url])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  function handlePresetSelect(preset: (typeof SYMBOL_PRESETS)[number]) {
    setIsOpen(false)
    helpers.setValue({ name: preset.name, symbol: preset.symbol })
  }

  const currentLabel =
    SYMBOL_PRESETS.find((p) => p.symbol === field?.value?.symbol)?.label ||
    field?.value?.symbol

  return (
    <div className={styles.datatoken}>
      <figure className={styles.image}>
        <Key />
      </figure>
      <div className={styles.tokenWrapper}>
        <span className={styles.label}>Access Token</span>

        <div className={styles.selectorWrapper} ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={styles.selector}
          >
            <span>{currentLabel}</span>
            <ChevronDownIcon
              className={`${styles.chevron} ${
                isOpen ? styles.chevronOpen : ''
              }`}
            />
          </button>

          {isOpen && (
            <>
              <div
                className={styles.backdrop}
                onClick={() => setIsOpen(false)}
              />
              <div className={styles.menu}>
                {SYMBOL_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={
                      preset.label === currentLabel
                        ? styles.optionSelected
                        : styles.option
                    }
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
