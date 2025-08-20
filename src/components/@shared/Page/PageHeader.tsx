import BrandLogo from '@images/pontusx_logo_horizontal.svg'
import GaiaXLogo from '@images/gaia-x-logo.svg'
import Markdown from '@shared/Markdown'
import classNames from 'classnames/bind'
import { ReactElement } from 'react'
import NetworkStatus from '../NetworkStatus'
import styles from './PageHeader.module.css'

const cx = classNames.bind(styles)

export default function PageHeader({
  title,
  center,
  description,
  isHome
}: {
  title: string | ReactElement
  center?: boolean
  description?: string
  isHome?: boolean
}): ReactElement {
  const styleClasses = cx({
    header: true,
    center
  })

  return (
    <header className={styleClasses}>
      {isHome ? (
        <div className={styles.homeTitleContainer}>
          <BrandLogo />
          {description && (
            <Markdown text={description} className={styles.subtitle} />
          )}
          <div className={styles.logoContainer}>
            <h4 className={styles.logoContainerTitle}>powered by</h4>
            <a
              href="https://gaia-x.eu/"
              target="_blank"
              rel="noreferrer noopener"
            >
              <GaiaXLogo />
            </a>
          </div>
        </div>
      ) : (
        <div>
          <h1 className={styles.title}>{title}</h1>
          <NetworkStatus className={styles.networkAlert} />
        </div>
      )}
      {description && !isHome && (
        <Markdown text={description} className={styles.description} />
      )}
      {/* SearchBar removed - now using header expanded search bar instead */}
    </header>
  )
}
