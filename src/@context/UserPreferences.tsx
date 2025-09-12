import {
  createContext,
  useContext,
  ReactElement,
  ReactNode,
  useState,
  useEffect
} from 'react'
import { LoggerInstance, LogLevel } from '@oceanprotocol/lib'
import { isBrowser } from '@utils/index'
import { useMarketMetadata } from './MarketMetadata'
import { AUTOMATION_MODES } from './Automation/AutomationProvider'

interface UserPreferencesValue {
  prefsHydrated: boolean
  debug: boolean
  setDebug: (value: boolean) => void
  currency: string
  setCurrency: (value: string) => void
  chainIds: number[]
  privacyPolicySlug: string
  showPPC: boolean
  setChainIds: (chainIds: number[]) => void
  bookmarks: string[]
  addBookmark: (did: string) => void
  removeBookmark: (did: string) => void
  setPrivacyPolicySlug: (slug: string) => void
  setShowPPC: (value: boolean) => void
  allowExternalContent: boolean
  setAllowExternalContent: (value: boolean) => void
  locale: string
  automationWalletJSON: string
  setAutomationWalletJSON: (encryptedWallet: string) => void
  automationWalletMode: AUTOMATION_MODES
  setAutomationWalletMode: (mode: AUTOMATION_MODES) => void
  showOnboardingModule: boolean
  setShowOnboardingModule: (value: boolean) => void
  onboardingStep: number
  setOnboardingStep: (step: number) => void
}

const UserPreferencesContext = createContext(null)

const localStorageKey = 'ocean-user-preferences-v4'

function getLocalStorage(): Partial<UserPreferencesValue> | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage.getItem(localStorageKey)
    return raw ? (JSON.parse(raw) as Partial<UserPreferencesValue>) : undefined
  } catch {
    return undefined
  }
}

function setLocalStorage(values: Partial<UserPreferencesValue>) {
  return (
    isBrowser &&
    window.localStorage.setItem(localStorageKey, JSON.stringify(values))
  )
}

function UserPreferencesProvider({
  children
}: {
  children: ReactNode
}): ReactElement {
  const { appConfig } = useMarketMetadata()
  // Initialize with stable SSR-friendly defaults; hydrate from localStorage on mount
  const [prefsHydrated, setPrefsHydrated] = useState<boolean>(false)
  const [debug, setDebug] = useState<boolean>(false)
  const [currency, setCurrency] = useState<string>('EUR')
  const [locale, setLocale] = useState<string>()
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [chainIds, setChainIds] = useState<number[]>(appConfig.chainIds)
  const { defaultPrivacyPolicySlug, showOnboardingModuleByDefault } = appConfig

  const [privacyPolicySlug, setPrivacyPolicySlug] = useState<string>(
    defaultPrivacyPolicySlug
  )

  const [showPPC, setShowPPC] = useState<boolean>(true)

  const [allowExternalContent, setAllowExternalContent] =
    useState<boolean>(false)

  const [automationWallet, setAutomationWallet] = useState<string>('')

  const [automationWalletMode, setAutomationWalletMode] =
    useState<AUTOMATION_MODES>(AUTOMATION_MODES.SIMPLE)

  const [showOnboardingModule, setShowOnboardingModule] = useState<boolean>(
    showOnboardingModuleByDefault
  )

  const [onboardingStep, setOnboardingStep] = useState<number>(0)

  // Hydrate from localStorage on client after mount
  useEffect(() => {
    const stored = getLocalStorage()
    if (!stored) {
      setPrefsHydrated(true)
      return
    }
    if (typeof stored.debug === 'boolean') setDebug(stored.debug)
    if (typeof stored.currency === 'string') setCurrency(stored.currency)
    if (Array.isArray(stored.bookmarks)) setBookmarks(stored.bookmarks)
    if (Array.isArray(stored.chainIds)) setChainIds(stored.chainIds as number[])
    if (typeof stored.privacyPolicySlug === 'string')
      setPrivacyPolicySlug(stored.privacyPolicySlug)
    if (typeof stored.showPPC === 'boolean') setShowPPC(stored.showPPC)
    if (typeof stored.allowExternalContent === 'boolean')
      setAllowExternalContent(stored.allowExternalContent)
    if (typeof stored.automationWalletJSON === 'string')
      setAutomationWallet(stored.automationWalletJSON)
    if (
      stored.automationWalletMode === AUTOMATION_MODES.SIMPLE ||
      stored.automationWalletMode === AUTOMATION_MODES.ADVANCED
    )
      setAutomationWalletMode(stored.automationWalletMode)
    if (typeof stored.showOnboardingModule === 'boolean')
      setShowOnboardingModule(stored.showOnboardingModule)
    if (typeof stored.onboardingStep === 'number')
      setOnboardingStep(stored.onboardingStep)
    setPrefsHydrated(true)
  }, [])

  // Write values to localStorage on change
  useEffect(() => {
    setLocalStorage({
      chainIds,
      debug,
      currency,
      bookmarks,
      privacyPolicySlug,
      showPPC,
      allowExternalContent,
      automationWalletJSON: automationWallet,
      automationWalletMode,
      showOnboardingModule,
      onboardingStep
    })
  }, [
    chainIds,
    debug,
    currency,
    bookmarks,
    privacyPolicySlug,
    showPPC,
    allowExternalContent,
    automationWallet,
    automationWalletMode,
    showOnboardingModule,
    onboardingStep
  ])

  // Set ocean.js log levels, default: Error
  useEffect(() => {
    debug === true
      ? LoggerInstance.setLevel(LogLevel.Verbose)
      : LoggerInstance.setLevel(LogLevel.Error)
  }, [debug])

  // Get locale always from user's browser
  useEffect(() => {
    if (typeof window === 'undefined') return
    setLocale(window.navigator.language)
  }, [])

  function addBookmark(didToAdd: string): void {
    const newPinned = [...bookmarks, didToAdd]
    setBookmarks(newPinned)
  }

  function removeBookmark(didToAdd: string): void {
    const newPinned = bookmarks.filter((did: string) => did !== didToAdd)
    setBookmarks(newPinned)
  }

  // Bookmarks old data structure migration
  useEffect(() => {
    if (bookmarks.length !== undefined) return
    const newPinned: string[] = []
    for (const network in bookmarks) {
      ;(bookmarks[network] as unknown as string[]).forEach((did: string) => {
        did !== null && newPinned.push(did)
      })
    }
    setBookmarks(newPinned)
  }, [bookmarks])

  // chainIds old data migration
  // remove deprecated networks from user-saved chainIds
  useEffect(() => {
    if (!chainIds.includes(3) && !chainIds.includes(4)) return
    const newChainIds = chainIds.filter((id) => id !== 3 && id !== 4)
    setChainIds(newChainIds)
  }, [chainIds])

  return (
    <UserPreferencesContext.Provider
      value={
        {
          prefsHydrated,
          debug,
          currency,
          locale,
          chainIds,
          bookmarks,
          privacyPolicySlug,
          showPPC,
          setChainIds,
          setDebug,
          setCurrency,
          addBookmark,
          removeBookmark,
          setPrivacyPolicySlug,
          setShowPPC,
          allowExternalContent,
          setAllowExternalContent,
          automationWalletJSON: automationWallet,
          setAutomationWalletJSON: setAutomationWallet,
          automationWalletMode,
          setAutomationWalletMode,
          showOnboardingModule,
          setShowOnboardingModule,
          onboardingStep,
          setOnboardingStep
        } as UserPreferencesValue
      }
    >
      {children}
    </UserPreferencesContext.Provider>
  )
}

// Helper hook to access the provider values
const useUserPreferences = (): UserPreferencesValue =>
  useContext(UserPreferencesContext)

export { UserPreferencesProvider, useUserPreferences }
