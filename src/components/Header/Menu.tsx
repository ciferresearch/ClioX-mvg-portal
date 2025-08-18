import { ReactElement } from 'react'
import Link from 'next/link'
import loadable from '@loadable/component'
import Logo from '@shared/atoms/Logo'
import Networks from './UserPreferences/Networks'
import { useRouter } from 'next/router'
import { useMarketMetadata } from '@context/MarketMetadata'
import MenuDropdown from '@components/@shared/MenuDropdown'
import SearchButton from './SearchButton'
import Button from '@components/@shared/atoms/Button'
import UserPreferences from './UserPreferences'
import Automation from './UserPreferences/Automation'
import NetworkMenu from './NetworkMenu'
const Wallet = loadable(() => import('./Wallet'))

declare type MenuItem = {
  name: string
  link?: string
  subItems?: MenuItem[]
  description?: string
  image?: string
  category?: string
  className?: string
  isLive?: boolean
}

export function MenuLink({ name, link, className, isLive }: MenuItem) {
  const router = useRouter()

  const currentPath = router?.pathname
  const isActive = link.startsWith('/') && currentPath === link

  const baseClasses =
    'px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-teal-50 hover:text-teal-700'
  const activeClasses = isActive ? 'bg-teal-100 text-teal-700' : 'text-gray-700'
  const finalClasses = `${baseClasses} ${activeClasses} ${className || ''}`

  return isLive === false ? (
    <></>
  ) : (
    <Button
      className={finalClasses}
      {...(link.startsWith('/') ? { to: link } : { href: link })}
    >
      {name}
    </Button>
  )
}

export default function Menu(): ReactElement {
  const { appConfig, siteContent } = useMarketMetadata()

  return (
    <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <Link
          href="/"
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          <Logo />
        </Link>

        <ul className="hidden md:flex items-center space-x-1">
          {siteContent?.menu.map((item: MenuItem) => (
            <li key={item.name}>
              {item?.subItems ? (
                <MenuDropdown label={item.name} items={item.subItems} />
              ) : (
                <MenuLink {...item} />
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-center space-x-2">
          <SearchButton />
          {appConfig.chainIdsSupported.length > 1 && <Networks />}
          <NetworkMenu />
          <Wallet />
          {appConfig.automationConfig.enableAutomation === 'true' && (
            <Automation />
          )}
          <UserPreferences />
        </div>
      </div>
    </nav>
  )
}
