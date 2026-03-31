import { ReactElement, useState, useEffect, useRef } from 'react'
import { useField, useFormikContext } from 'formik'
import UrlInput from '../URLInput'
import { InputProps } from '@shared/FormInput'
import FileInfo from '../FilesInput/Info'
import styles from './index.module.css'
import Button from '@shared/atoms/Button'
import {
  LoggerInstance,
  ProviderInstance,
  getErrorMessage
} from '@oceanprotocol/lib'
import { FormPublishData } from '@components/Publish/_types'
import { getOceanConfig } from '@utils/ocean'
import { getProvidersForChain } from '../../../../../../chains.config'
import axios from 'axios'
import { useCancelToken } from '@hooks/useCancelToken'
import { useNetwork } from 'wagmi'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

export default function CustomProvider(props: InputProps): ReactElement {
  const { chain } = useNetwork()
  const newCancelToken = useCancelToken()
  const { initialValues, setFieldError } = useFormikContext<FormPublishData>()
  const [field, meta, helpers] = useField(props.name)
  const [isLoading, setIsLoading] = useState(false)
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const chainId = chain?.id || 32457
  const providers = getProvidersForChain(chainId)

  useEffect(() => {
    setIsCustomMode(false)
  }, [chainId])

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

  async function validateProvider(url: string, custom: boolean) {
    try {
      setIsLoading(true)

      const isValid = await ProviderInstance.isValidProvider(url)
      if (!isValid) {
        setFieldError(
          `${field.name}.url`,
          '✗ No valid provider detected. Check your network, your URL and try again.'
        )
        LoggerInstance.error(
          '[Custom Provider]:',
          '✗ No valid provider detected.'
        )
        return
      }

      const providerResponse = await axios.get(url, {
        cancelToken: newCancelToken()
      })
      const providerChain =
        providerResponse?.data?.chainId || providerResponse?.data?.chainIds

      const isCompatible =
        providerChain === chainId
          ? true
          : !!(providerChain.length > 0 && providerChain.includes(chainId))

      if (!isCompatible) {
        setFieldError(
          `${field.name}.url`,
          '✗ This provider is incompatible with the network your wallet is connected to.'
        )
        LoggerInstance.error(
          '[Custom Provider]:',
          '✗ Provider incompatible with current network.'
        )
        return
      }

      helpers.setValue({ url, valid: isValid, custom })
    } catch (error) {
      const message = getErrorMessage(error.message)
      setFieldError(`${field.name}.url`, message)
      LoggerInstance.error('[Custom Provider]:', message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleValidation(e: React.SyntheticEvent) {
    e.preventDefault()
    await validateProvider(field.value.url, true)
  }

  function handleDefault(e: React.SyntheticEvent) {
    e.preventDefault()
    const oceanConfig = getOceanConfig(chainId)
    const providerUrl =
      oceanConfig?.providerUri || initialValues.services[0].providerUrl.url
    helpers.setValue({ url: providerUrl, valid: true, custom: false })
    setIsCustomMode(false)
  }

  async function handleOptionSelect(value: string) {
    setIsOpen(false)

    if (value === '__custom__') {
      setIsCustomMode(true)
      setPendingSelection(null)
      helpers.setValue({ url: '', valid: false, custom: true })
      return
    }

    setIsCustomMode(false)
    setPendingSelection(value)
    await validateProvider(value, false)
    setPendingSelection(null)
  }

  function handleCustomFileInfoClose() {
    helpers.setValue({ url: '', valid: false, custom: true })
    helpers.setTouched(false)
  }

  // ── No providers configured: original fallback ──
  if (providers.length === 0) {
    if (field?.value?.valid === true) {
      return (
        <FileInfo
          file={field.value}
          handleClose={() => {
            helpers.setValue({ url: '', valid: false, custom: true })
            helpers.setTouched(false)
          }}
        />
      )
    }
    return (
      <>
        <UrlInput
          submitText="Validate"
          {...props}
          name={`${field.name}.url`}
          isLoading={isLoading}
          handleButtonClick={handleValidation}
        />
        <Button
          style="text"
          size="small"
          onClick={handleDefault}
          className={styles.default}
        >
          Use Default Provider
        </Button>
      </>
    )
  }

  // ── Has providers: custom dropdown UI ──

  const activeUrl = pendingSelection || field?.value?.url
  const matchedProvider = providers.find((p) => p.url === activeUrl)
  const displayLabel = isCustomMode
    ? 'Custom'
    : matchedProvider?.name || providers[0]?.name

  const allOptions = [
    ...providers.map((p) => ({ value: p.url, label: p.name })),
    { value: '__custom__', label: 'Custom' }
  ]

  const currentValue = isCustomMode
    ? '__custom__'
    : activeUrl || providers[0]?.url

  return (
    <>
      {/* Dropdown */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={styles.trigger}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {displayLabel}
          <ChevronDownIcon
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          />
        </button>

        {isOpen && (
          <>
            <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
            <div className={styles.menu}>
              {allOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionSelect(option.value)}
                  className={
                    option.value === currentValue
                      ? styles.optionSelected
                      : styles.option
                  }
                  role="option"
                  aria-selected={option.value === currentValue}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Status line */}
      {!isCustomMode && (
        <p
          className={
            isLoading ? styles.statusValidating : styles.statusConnected
          }
        >
          {isLoading
            ? 'Validating provider...'
            : matchedProvider && field?.value?.valid
            ? `✓ Connected to ${matchedProvider.name}`
            : null}
        </p>
      )}

      {/* Custom mode */}
      {isCustomMode && (
        <div className={styles.customExpand}>
          {field?.value?.valid ? (
            <FileInfo
              file={field.value}
              handleClose={handleCustomFileInfoClose}
            />
          ) : (
            <UrlInput
              submitText="Validate"
              {...props}
              name={`${field.name}.url`}
              isLoading={isLoading}
              handleButtonClick={handleValidation}
            />
          )}
        </div>
      )}
    </>
  )
}
