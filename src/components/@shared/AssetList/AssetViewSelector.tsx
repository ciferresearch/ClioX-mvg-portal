import { ReactElement } from 'react'
import { motion } from 'framer-motion'
import GridViewIcon from '@images/grid-view-icon.svg'
import ListViewIcon from '@images/list-view-icon.svg'

export enum AssetViewOptions {
  Grid = 'grid',
  List = 'list'
}

const assetViews = [
  { value: AssetViewOptions.Grid, icon: <GridViewIcon /> },
  { value: AssetViewOptions.List, icon: <ListViewIcon /> }
]

export default function AssetViewSelector({
  activeAssetView,
  setActiveAssetView
}: {
  activeAssetView: AssetViewOptions
  setActiveAssetView: (activeView: AssetViewOptions) => void
}): ReactElement {
  return (
    <div className="flex justify-end gap-2 mb-2">
      {assetViews.map((view, index) => {
        const isSelected = view.value === activeAssetView
        return (
          <motion.button
            key={view.value}
            className={`
              p-0 bg-transparent border-none w-6 h-6 min-w-[1.5rem] 
              cursor-pointer transition-colors duration-200 ease-in-out
              ${
                isSelected
                  ? '[&_svg_path]:fill-current text-gray-900'
                  : '[&_svg_path]:fill-current text-gray-400 hover:text-gray-700'
              }
            `}
            title={`Switch to ${view.value} view`}
            onClick={() => setActiveAssetView(view.value)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              opacity: { duration: 0.3, delay: index * 0.1 },
              y: { duration: 0.3, delay: index * 0.1 },
              scale: { duration: 0.1 }
            }}
          >
            <div className="w-6 h-6">{view.icon}</div>
          </motion.button>
        )
      })}
    </div>
  )
}
