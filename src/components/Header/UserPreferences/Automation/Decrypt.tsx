import { FormEvent, ReactElement, useEffect, useRef } from 'react'

import Button from '../../../@shared/atoms/Button'
import { toast } from 'react-toastify'
import { useAutomation } from '../../../../@context/Automation/AutomationProvider'
import Loader from '../../../@shared/atoms/Loader'
import InputElement from '../../../@shared/FormInput/InputElement'

export default function Decrypt(): ReactElement {
  const {
    isLoading,
    decryptPercentage,
    decryptAutomationWallet,
    setIsAutomationEnabled
  } = useAutomation()

  const decryptToastRef = useRef(null)
  const passwordInputRef = useRef(null)

  useEffect(() => {
    toast.update(decryptToastRef.current, { progress: decryptPercentage })
  }, [decryptToastRef, decryptPercentage])

  const initiateDecryption = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!passwordInputRef.current.value) {
      toast.error('Please provide the password before attempting decryption.')
      return
    }
    decryptToastRef.current = toast.info(`Decrypting Wallet...`)
    if (await decryptAutomationWallet(passwordInputRef.current.value))
      setIsAutomationEnabled(true)
    toast.done(decryptToastRef.current)
  }

  return (
    <div className="p-4 space-y-3">
      {isLoading ? (
        <Loader message="Decrypting..." />
      ) : (
        <>
          <strong className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            The wallet is locked!
          </strong>
          <form onSubmit={initiateDecryption} className="space-y-3">
            <InputElement
              name="password"
              placeholder="Password"
              label="Password"
              type="password"
              ref={passwordInputRef}
            />
            <Button type="submit">Decrypt</Button>
          </form>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Enter the password that was used to encrypt this wallet.
          </span>
        </>
      )}
    </div>
  )
}
