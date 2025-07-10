import { ReactElement } from 'react'
import { useUserPreferences } from '@context/UserPreferences'
import { useGdprMetadata } from '@hooks/useGdprMetadata'
import Button from '@shared/atoms/Button'
import Logo from '@shared/atoms/Logo'
import { useMarketMetadata } from '@context/MarketMetadata'
import styles from './Links.module.css'
import Image from 'next/image'
import Link from 'next/link'

export default function Links(): ReactElement {
  const { appConfig } = useMarketMetadata()
  const { setShowPPC, privacyPolicySlug } = useUserPreferences()
  const cookies = useGdprMetadata()

  const partnerLogos = [
    {
      src: '/images/logos/interpares.png',
      alt: 'InterPARES Trust AI',
      url: 'https://interparestrustai.org/'
    },
    {
      src: '/images/logos/nserc.svg',
      alt: 'NSERC',
      url: 'https://www.nserc-crsng.gc.ca/'
    },
    {
      src: '/images/logos/sshrc.webp',
      alt: 'SSHRC',
      url: 'https://www.sshrc-crsh.gc.ca/'
    },
    {
      src: '/images/logos/ubc.png',
      alt: 'UBC',
      url: 'https://www.ubc.ca/'
    },
    {
      src: '/images/logos/udl.svg',
      alt: 'Universidad de Lleida',
      url: 'http://www.udl.es/ca/'
    },
    {
      src: '/images/logos/uned.svg',
      alt: 'UNED',
      url: 'https://www.uned.es/'
    }
  ]

  return (
    <div>
      {/* Partner logos section - Shows at top on mobile, left side on desktop */}
      <div className="block md:hidden">
        <div className="w-full flex flex-wrap gap-4 justify-center">
          {partnerLogos.map((logo, index) => (
            <a
              key={index}
              href={logo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-white rounded p-2 transition-transform hover:scale-105"
              style={{
                width: index % 3 === 1 ? '120px' : '110px',
                height: '75px',
                marginBottom: index < 3 ? '15px' : '0'
              }}
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={100}
                height={60}
                className="w-auto h-auto"
                style={{ maxHeight: '50px', objectFit: 'contain' }}
                unoptimized={true}
              />
            </a>
          ))}
        </div>

        <p className="text-[13px] mt-4 max-w-3xl text-gray-600 text-center">
          Clio-X draws on research supported by InterPARES Trust AI, The Social
          Sciences and Humanities Research Council of Canada (SSHRC), The
          University of British Columbia (UBC), Universidad Nacional de
          Educación a Distancia (UNED), The University of Lleida (UdL), and The
          Natural Sciences and Engineering Research Council of Canada (NSERC).
        </p>

        <hr className="my-6 border-gray-200" />
      </div>

      {/* Main grid layout - Desktop layout is side by side, Mobile has links below logos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 w-full">
        {/* Partner logos - Only shown in desktop view as left panel */}
        <div className="hidden md:block md:col-span-2 md:mt-4">
          <div className="w-sm flex flex-wrap gap-3 justify-start">
            {partnerLogos.map((logo, index) => (
              <a
                key={index}
                href={logo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center bg-white rounded p-2 transition-transform hover:scale-105"
                style={{
                  width: index % 3 === 1 ? '115px' : '105px',
                  height: '70px',
                  marginBottom: index < 3 ? '12px' : '0'
                }}
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={95}
                  height={55}
                  className="w-auto h-auto"
                  style={{ maxHeight: '48px', objectFit: 'contain' }}
                  unoptimized={true}
                />
              </a>
            ))}
          </div>

          <p className="text-[13px] mt-5 max-w-md text-gray-600">
            Clio-X draws on research supported by InterPARES Trust AI, The
            Social Sciences and Humanities Research Council of Canada (SSHRC),
            The University of British Columbia (UBC), Universidad Nacional de
            Educación a Distancia (UNED), The University of Lleida (UdL), and
            The Natural Sciences and Engineering Research Council of Canada
            (NSERC).
          </p>
        </div>

        {/* Right side content - Contains all links and community section */}
        <div className="col-span-2 md:col-span-2 md:pl-6 md:flex md:justify-end">
          <div className="grid grid-cols-2 gap-y-5 gap-x-8 w-full max-w-lg">
            {/* Column 1: Clio-X */}
            <div className="col-span-1">
              {/* Logo as title */}
              <div className={styles.titleContainer}>
                <div className="flex items-center">
                  <Link
                    href="/"
                    className={`${styles.footerLogo} transition-opacity hover:opacity-80`}
                  >
                    <Logo variant="horizontal" />
                  </Link>
                </div>
              </div>

              <ul className="space-y-2.5 mt-0">
                <li>
                  <Button
                    to="/docs"
                    className={`${styles.link} ${styles.footerLink}`}
                    style="text"
                  >
                    Documentation
                  </Button>
                </li>
                <li>
                  <Button
                    to="/newsletter"
                    className={`${styles.link} ${styles.footerLink}`}
                    style="text"
                  >
                    Newsletter
                  </Button>
                </li>
                <li>
                  <Button
                    to="/bookmarks"
                    className={`${styles.link} ${styles.footerLink}`}
                    style="text"
                  >
                    Bookmarks
                  </Button>
                </li>
              </ul>
            </div>

            {/* Column 2: Legal */}
            <div className="col-span-1">
              <div className={styles.titleContainer}>
                <h3 className={styles.sectionTitle}>Legal</h3>
              </div>

              <ul className="space-y-2.5 mt-0">
                <li>
                  <Button
                    to={privacyPolicySlug || '/privacy'}
                    className={`${styles.link} ${styles.footerLink}`}
                    style="text"
                  >
                    Privacy Policy
                  </Button>
                </li>
                <li>
                  <Button
                    to="/imprint"
                    className={`${styles.link} ${styles.footerLink}`}
                    style="text"
                  >
                    Imprint
                  </Button>
                </li>
                {appConfig?.privacyPreferenceCenter === 'true' && (
                  <li>
                    <Button
                      style="text"
                      onClick={() => setShowPPC(true)}
                      className={`${styles.link} ${styles.footerLink}`}
                    >
                      Cookie Settings
                    </Button>
                  </li>
                )}
              </ul>
            </div>

            {/* Join the community - Full width of right side */}
            <div className="col-span-2 mt-1">
              <h3 className={`${styles.sectionTitle} mb-1.5`}>
                Stay in the loop
              </h3>
              <p className={`${styles.subtitle} text-sm mb-2.5`}>
                Bite-sized insights on Web3 tech to help you explore Clio-X with
                confidence — delivered monthly.
              </p>
              <Link href="/coming-soon">
                <button className="bg-[var(--color-primary)] hover:bg-[var(--color-highlight)] text-white font-bold py-2 px-5 rounded transition-colors cursor-pointer">
                  Subscribe
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
