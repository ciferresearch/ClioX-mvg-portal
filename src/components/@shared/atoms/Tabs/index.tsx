import { ReactElement, ReactNode } from 'react'
import { Tab, Tabs as ReactTabs, TabList, TabPanel } from 'react-tabs'
import InputRadio from '@shared/FormInput/InputElement/Radio'
import styles from './index.module.css'

export interface TabsItem {
  title: string
  content: ReactNode
  disabled?: boolean
}

export interface TabsProps {
  items: TabsItem[]
  className?: string
  handleTabChange?: (tabName: string) => void
  showRadio?: boolean
  selectedIndex?: number
  onIndexSelected?: (index: number) => void
  variant?: 'default' | 'modern'
}

export default function Tabs({
  items,
  className,
  handleTabChange,
  showRadio,
  selectedIndex,
  onIndexSelected,
  variant = 'default'
}: TabsProps): ReactElement {
  // Modern variant uses Tailwind classes
  if (variant === 'modern') {
    return (
      <ReactTabs
        className={`${className || ''}`}
        selectedIndex={selectedIndex}
        onSelect={onIndexSelected}
      >
        <div className="border-b border-gray-200">
          <TabList className="text-center p-4 flex justify-center overflow-x-auto scrollbar-hide">
            {items.map((item, index) => (
              <Tab
                className={`inline-block px-3 py-2 font-semibold text-sm uppercase transition-all duration-200 cursor-pointer relative focus:outline-none ${
                  index === selectedIndex
                    ? 'bg-emerald-500 text-white border-2 border-gray-300 opacity-100 z-20 shadow-sm hover:border-emerald-600'
                    : 'bg-white text-gray-600 border-2 border-gray-300 opacity-90 hover:bg-emerald-50 hover:text-emerald-700'
                } ${index === 0 ? 'rounded-l-lg' : '-ml-0.5'} ${
                  index === items.length - 1 ? 'rounded-r-lg' : ''
                }`}
                key={index}
                onClick={
                  handleTabChange ? () => handleTabChange(item.title) : null
                }
                disabled={item.disabled}
              >
                {showRadio ? (
                  <InputRadio
                    name={item.title}
                    type="radio"
                    checked={index === selectedIndex}
                    options={[item.title]}
                    readOnly
                  />
                ) : (
                  item.title
                )}
              </Tab>
            ))}
          </TabList>
        </div>
        <div className="p-4 lg:p-6">
          {items.map((item, index) => (
            <TabPanel key={index}>{item.content}</TabPanel>
          ))}
        </div>
      </ReactTabs>
    )
  }

  // Default variant uses original CSS modules
  return (
    <ReactTabs
      className={`${className || ''}`}
      selectedIndex={selectedIndex}
      onSelect={onIndexSelected}
    >
      <div className={styles.tabListContainer}>
        <TabList className={styles.tabList}>
          {items.map((item, index) => (
            <Tab
              className={styles.tab}
              key={index}
              onClick={
                handleTabChange ? () => handleTabChange(item.title) : null
              }
              disabled={item.disabled}
            >
              {showRadio ? (
                <InputRadio
                  className={styles.radioInput}
                  name={item.title}
                  type="radio"
                  checked={index === selectedIndex}
                  options={[item.title]}
                  readOnly
                />
              ) : (
                item.title
              )}
            </Tab>
          ))}
        </TabList>
      </div>
      <div className={styles.tabContent}>
        {items.map((item, index) => (
          <TabPanel key={index}>{item.content}</TabPanel>
        ))}
      </div>
    </ReactTabs>
  )
}
