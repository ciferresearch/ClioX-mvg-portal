import { ReactElement } from 'react'
import EthIcon from '@images/eth.svg'
import PolygonIcon from '@images/polygon.svg'
import MoonbeamIcon from '@images/moonbeam.svg'
import BscIcon from '@images/bsc.svg'
import EnergywebIcon from '@images/energyweb.svg'

export function NetworkIcon({ name }: { name: string }): ReactElement {
  const IconMapped = name.includes('ETH')
    ? EthIcon
    : name.includes('Polygon') || name.includes('Mumbai')
    ? PolygonIcon
    : name.includes('Moon')
    ? MoonbeamIcon
    : name.includes('BSC')
    ? BscIcon
    : name.includes('Energy Web')
    ? EnergywebIcon
    : EthIcon // ETH icon as fallback

  return <IconMapped className="inline-block w-4 h-4 fill-current" />
}
