import { ReactElement } from 'react'
import Menu from './Menu'

export default function Header(): ReactElement {
  return (
    <header className="bg-white border-b border-gray-100 shadow-sm">
      <Menu />
    </header>
  )
}
