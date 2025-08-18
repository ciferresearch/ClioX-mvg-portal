import { ReactElement, useState } from 'react'
import { useAutomation } from '../../../../@context/Automation/AutomationProvider'
import Loader from '../../../@shared/atoms/Loader'
import { LoggerInstance } from '@oceanprotocol/lib'
import { toast } from 'react-toastify'

export default function Import(): ReactElement {
  const { isLoading, importAutomationWallet } = useAutomation()

  const [showFileInput, setShowFileInput] = useState<boolean>()

  const isValidEncryptedWalletJson = (content: string) => {
    try {
      const json = JSON.parse(content)

      if (!json?.address || !json?.id || !json?.version || !json?.crypto)
        return false
    } catch (e) {
      return false
    }
    return true
  }

  const importWalletFromFile = async (target: EventTarget) => {
    try {
      const file = (target as HTMLInputElement).files?.[0]
      const reader = new FileReader()
      reader.readAsText(file)
      reader.onload = async (event) => {
        const fileContent = event.target.result.toString()

        if (!isValidEncryptedWalletJson(fileContent)) {
          LoggerInstance.error(
            '[AutomationWalletImport] Could not import file. Invalid content!'
          )
          toast.error(
            'The provided file has unexpected content and cannot be imported.'
          )
          return
        }

        await importAutomationWallet(fileContent)
      }
    } catch (e) {
      LoggerInstance.error(e)
    }
  }

  return (
    <div className="p-2 space-y-3">
      {showFileInput ? (
        <>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 rounded-lg p-3 space-y-2">
            <label className="block text-xs font-medium text-gray-700">
              Select file to import
            </label>
            <input
              name="walletJSONFile"
              type="file"
              accept=".json"
              onChange={(e) => {
                importWalletFromFile(e.target)
              }}
              className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-emerald-50 file:text-emerald-600 hover:file:bg-emerald-100 transition-colors duration-200"
            />
          </div>
          <button
            onClick={() => setShowFileInput(false)}
            className="text-xs text-gray-500 hover:text-emerald-600 font-medium transition-colors duration-200 cursor-pointer"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          onClick={() => setShowFileInput(true)}
          disabled={isLoading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-1.5 px-3 text-sm font-medium transition-colors duration-200 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? <Loader /> : `Import Wallet JSON`}
        </button>
      )}
    </div>
  )
}
