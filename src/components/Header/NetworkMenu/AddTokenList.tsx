import { ReactElement } from 'react'
import { motion } from 'motion/react'
import AddToken from '@components/@shared/AddToken'
import EUROeLogo from '@images/EUROe_Symbol_Black.svg'
import OceanLogo from '@images/logo.svg'
import { useMarketMetadata } from '@context/MarketMetadata'

export const tokenLogos = {
  EUROe: {
    image: <EUROeLogo />,
    url: 'https://dev.euroe.com/img/EUROe_Symbol_Black.svg'
  },
  OCEAN: {
    image: <OceanLogo />,
    url: 'https://raw.githubusercontent.com/oceanprotocol/art/main/logo/token.png'
  }
}

export default function AddTokenList(): ReactElement {
  const { approvedBaseTokens } = useMarketMetadata()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {approvedBaseTokens?.map((token, index) => (
        <motion.div
          key={token.address}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.2 }}
          className="cursor-pointer"
        >
          <AddToken
            address={token.address}
            symbol={token.symbol}
            decimals={token.decimals}
            logo={tokenLogos?.[token.symbol]}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
