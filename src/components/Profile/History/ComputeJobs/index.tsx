import { useUserPreferences } from '@context/UserPreferences'
import Refresh from '@images/refresh.svg'
import AssetListTitle from '@shared/AssetListTitle'
import NetworkName from '@shared/NetworkName'
import Button from '@shared/atoms/Button'
import Table, { TableOceanColumn } from '@shared/atoms/Table'
import Time from '@shared/atoms/Time'
import { ReactElement, useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import Details from './Details'
import { motion } from 'motion/react'

export function Status({ children }: { children: string }): ReactElement {
  return (
    <motion.div className="text-transform-uppercase text-gray-600 font-medium text-xs">
      {children}
    </motion.div>
  )
}

const columns: TableOceanColumn<ComputeJobMetaData>[] = [
  {
    name: 'Dataset',
    width: '3fr',
    selector: (row) => (
      <AssetListTitle did={row.inputDID[0]} title={row.assetName} />
    )
  },
  {
    name: 'Network',
    width: '1.5fr',
    selector: (row) => <NetworkName networkId={row.networkId} />
  },
  {
    name: 'Provider',
    width: '2fr',
    selector: (row) => (
      <span title={row.providerUrl} className="text-gray-700 truncate">
        {row.providerUrl}
      </span>
    )
  },
  {
    name: 'Created',
    width: '1fr',
    selector: (row) => <Time date={row.dateCreated} isUnix relative />
  },
  {
    name: 'Finished',
    width: '1fr',
    selector: (row) =>
      row.dateFinished ? <Time date={row.dateFinished} isUnix relative /> : ''
  },
  {
    name: 'Status',
    width: '1fr',
    selector: (row) => <Status>{row.statusText}</Status>
  }
]

const defaultActionsColumn: TableOceanColumn<ComputeJobMetaData> = {
  name: 'Actions',
  width: '1fr',
  selector: (row) => <Details job={row} />
}

export type GetCustomActions = (job: ComputeJobMetaData) => {
  label: ReactElement
  onClick: (job: ComputeJobMetaData) => void
}[]

export default function ComputeJobs({
  minimal,
  jobs,
  isLoading,
  refetchJobs,
  getActions,
  hideDetails
}: {
  minimal?: boolean
  jobs?: ComputeJobMetaData[]
  isLoading?: boolean
  refetchJobs?: any
  getActions?: (job: ComputeJobMetaData) => {
    label: ReactElement
    onClick: (job: ComputeJobMetaData) => void
  }[]
  hideDetails?: boolean
}): ReactElement {
  const { address: accountId } = useAccount()
  const { chainIds } = useUserPreferences()

  const [actionsColumn, setActionsColumn] =
    useState<TableOceanColumn<ComputeJobMetaData>>(defaultActionsColumn)

  useEffect(() => {
    if (!getActions) return
    setActionsColumn({
      name: defaultActionsColumn.name,
      selector: (row) => (
        <div className="inline-flex items-center gap-2">
          {getActions(row).map((action, i) => (
            <button
              key={`compute-job-action-${action.label}-${i}`}
              onClick={() => action.onClick(row)}
              className="min-w-24 text-center whitespace-nowrap text-xs font-medium text-emerald-700 hover:text-emerald-600 transition-colors duration-200"
            >
              {action.label}
            </button>
          ))}
          {!hideDetails && <Details job={row} />}
        </div>
      )
    })
  }, [getActions, hideDetails])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
    }
  }

  const buttonVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  }

  return accountId ? (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {jobs?.length >= 0 && !minimal && (
        <motion.div variants={buttonVariants} className="flex justify-center">
          <button
            title="Refresh compute jobs"
            onClick={async () => await refetchJobs(true)}
            disabled={isLoading}
            className="mb-2 block text-xs font-medium text-emerald-700 hover:text-emerald-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Refresh className="inline-block fill-current w-4 h-4 mr-2 -mb-0.5" />
            Refresh
          </button>
        </motion.div>
      )}
      <motion.div variants={itemVariants}>
        <Table
          columns={
            minimal
              ? // for minimal view, we only want 'Status', actions and 'Finished'
                [columns[5], actionsColumn, columns[4]]
              : [...columns, actionsColumn]
          }
          data={jobs}
          isLoading={isLoading}
          emptyMessage={chainIds.length === 0 ? 'No network selected' : null}
        />
      </motion.div>
    </motion.div>
  ) : (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center py-8 text-gray-600"
    >
      Please connect your wallet.
    </motion.div>
  )
}
