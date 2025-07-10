import { GlossaryTerm } from '@/components/Resources/types'

// Glossary data - this could be loaded from a CMS, API, or JSON files in the future
export const glossaryData: GlossaryTerm[] = [
  {
    id: 'artificial-intelligence',
    term: 'Artificial Intelligence',
    definition:
      'A sub-field of computer science research and practice that aims to develop computational models to simulate or approximate human cognition, behaviour, decision-making, and reasoning (InterPARES Trust AI).',
    link: 'https://interparestrustai.org/terminology/term/artificial%20intelligence/',
    letter: 'A',
    source: 'InterPARES Trust AI'
  },
  {
    id: 'blockchain',
    term: 'Blockchain',
    definition:
      'An open-source technology that supports trusted, immutable records of transactions stored in publicly accessible, decentralized, distributed, automated ledgers (InterPARES Trust AI).',
    link: 'https://interparestrustai.org/terminology/term/blockchain',
    letter: 'B',
    source: 'InterPARES Trust AI'
  },
  {
    id: 'cryptography',
    term: 'Cryptography',
    definition:
      'An important computer security tool that deals with techniques to store and transmit information in ways that prevent unauthorized access or interference (International Standards Organization).',
    link: 'https://www.iso.org/information-security/what-is-cryptography',
    letter: 'C',
    source: 'International Standards Organization'
  },
  {
    id: 'dao',
    term: 'Decentralized Autonomous Organization (DAO)',
    definition:
      'A blockchain-based system that enables people to coordinate and govern themselves mediated by a set of self-executing rules deployed on a public blockchain, and whose governance is decentralised (i.e., independent from central control) (Internet Policy Review).',
    link: 'https://policyreview.info/glossary/DAO',
    letter: 'D',
    source: 'Internet Policy Review'
  },
  {
    id: 'immutability',
    term: 'Immutability',
    definition:
      'Property of a distributed ledger wherein ledger records cannot be modified or removed once added to that distributed ledger (International Standards Organization).',
    link: 'https://www.iso.org/obp/ui/#iso:std:iso:22739:ed-2:v1:en:term:3.51',
    letter: 'I',
    source: 'International Standards Organization'
  },
  {
    id: 'machine-learning',
    term: 'Machine Learning',
    definition:
      'AI methodology that aims to create a model that can make predictions based on input features (InterPARES Trust AI).',
    link: 'https://interparestrustai.org/terminology/term/machine%20learning',
    letter: 'M',
    source: 'InterPARES Trust AI'
  },
  {
    id: 'smart-contract',
    term: 'Smart Contract',
    definition:
      'Computer program stored in a distributed ledger technology (DLT) system wherein the outcome of any execution of the program is recorded on the distributed ledger (International Standards Organization).',
    link: 'https://www.iso.org/obp/ui/#iso:std:iso:23257:ed-1:v1:en:term:3.24',
    letter: 'S',
    source: 'International Standards Organization'
  },
  {
    id: 'web3',
    term: 'Web3',
    definition:
      'Web3 has become a catch-all term for the vision of a new, better internet. At its core, Web3 uses blockchains, cryptocurrencies, and NFTs to give power back to the users in the form of ownership (Ethereum).',
    link: 'https://ethereum.org/en/web3/',
    letter: 'W',
    source: 'Ethereum'
  }
]

/**
 * Generate a custom SVG image for a glossary term
 */
export function generateGlossaryTermImage(term: string): string {
  // Truncate term if too long for display
  const displayTerm = term.length > 25 ? term.substring(0, 22) + '...' : term

  // Get first character using destructuring to satisfy ESLint
  const [firstChar] = term

  const svg = `
    <svg width="320" height="160" viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="320" height="160" fill="#f2e5d5"/>
      
      <!-- Decorative large letter in background -->
      <text x="280" y="140" font-family="IBM Plex Sans, sans-serif" font-size="120" font-weight="700" fill="#e0d5c7" text-anchor="end">
        ${firstChar.toUpperCase()}
      </text>
      
      <!-- GLOSSARY label -->
      <text x="20" y="35" font-family="IBM Plex Sans, sans-serif" font-size="12" font-weight="600" fill="#8b7355" text-transform="uppercase" letter-spacing="1px">
        GLOSSARY
      </text>
      
      <!-- Term name -->
      <text x="20" y="65" font-family="IBM Plex Sans, sans-serif" font-size="18" font-weight="600" fill="#4a3f36" text-anchor="start">
        ${displayTerm
          .split(' ')
          .map(
            (word, i) =>
              `<tspan x="20" dy="${i === 0 ? 0 : 22}">${word}</tspan>`
          )
          .join('')}
      </text>
      
      <!-- Decorative dots (uncomment to enable) -->
      <!-- <circle cx="25" cy="130" r="3" fill="#c8794d"/> -->
      <!-- <circle cx="35" cy="130" r="2" fill="#d4956b"/> -->
      <!-- <circle cx="43" cy="130" r="1.5" fill="#e0b187"/> -->

    </svg>
  `.trim()

  // Convert to base64 data URL
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Load all glossary terms
 */
export async function loadGlossaryTerms(): Promise<GlossaryTerm[]> {
  // In the future, this could load from a CMS, API, or JSON files
  return Promise.resolve([...glossaryData])
}

/**
 * Search glossary terms for global search functionality
 */
export function searchGlossaryTerms(query: string): GlossaryTerm[] {
  if (!query.trim()) return []

  const searchTerm = query.toLowerCase()
  return glossaryData.filter(
    (term) =>
      term.term.toLowerCase().includes(searchTerm) ||
      term.definition.toLowerCase().includes(searchTerm)
  )
}
