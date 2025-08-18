import { ReactElement } from 'react'
import Tooltip from '@shared/atoms/Tooltip'
import Cog from '@images/cog.svg'
import Debug from './Debug'
import Caret from '@images/caret.svg'
import ExternalContent from './ExternalContent'
import AutomationWalletMode from './AutomationWalletMode'
import Onboarding from './Onboarding'
import { useMarketMetadata } from '@context/MarketMetadata'

export default function UserPreferences(): ReactElement {
  const { appConfig } = useMarketMetadata()

  return (
    <Tooltip
      content={
        <ul className="bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px]">
          <li>
            <ExternalContent />
          </li>
          {appConfig.automationConfig.enableAutomation === 'true' && (
            <li>
              <AutomationWalletMode />
            </li>
          )}
          <li>
            <Onboarding />
          </li>
          <li>
            <Debug />
          </li>
        </ul>
      }
      trigger="click focus mouseenter"
      className="relative"
    >
      <button className="p-2 rounded-lg text-gray-600 hover:text-teal-700 hover:bg-teal-50 transition-colors duration-200 flex items-center space-x-1">
        <Cog aria-label="Preferences" className="w-5 h-5" />
        <Caret aria-hidden="true" className="w-3 h-3 opacity-60" />
      </button>
    </Tooltip>
  )
}
