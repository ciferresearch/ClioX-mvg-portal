import Dexie, { IndexableType, Table } from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import { ReactElement, ReactNode, createContext, useContext } from 'react'
import { DATABASE_NAME, DATABASE_VERSION } from './_contants'
import {
  TEXT_ANALYSIS_TABLE,
  TextAnalysisUseCaseData
} from './models/TextAnalysis.model'
import {
  CAMEROON_GAZETTE_TABLE,
  CameroonGazetteUseCaseData
} from './models/CameroonGazette.model'
import { LoggerInstance } from '@oceanprotocol/lib'

export class UseCaseDB extends Dexie {
  textAnalysises!: Table<TextAnalysisUseCaseData>
  cameroonGazettes!: Table<CameroonGazetteUseCaseData>
  constructor() {
    super(DATABASE_NAME)

    // TESTLOG

    this.version(DATABASE_VERSION).stores({
      ...TEXT_ANALYSIS_TABLE,
      ...CAMEROON_GAZETTE_TABLE
    })
  }
}

export const database = new UseCaseDB()

interface UseCasesValue {
  createOrUpdateTextAnalysis: (
    textAnalysis: TextAnalysisUseCaseData
  ) => Promise<IndexableType>
  textAnalysisList: TextAnalysisUseCaseData[] | undefined
  updateTextAnalysis: (
    textAnalysiseses: TextAnalysisUseCaseData[]
  ) => Promise<IndexableType>
  deleteTextAnalysis: (id: number) => Promise<void>
  clearTextAnalysis: () => Promise<void>
  // Cameroon Gazette store
  createOrUpdateCameroonGazette: (
    cameroon: CameroonGazetteUseCaseData
  ) => Promise<IndexableType>
  cameroonGazetteList: CameroonGazetteUseCaseData[] | undefined
  updateCameroonGazette: (
    cameroons: CameroonGazetteUseCaseData[]
  ) => Promise<IndexableType>
  deleteCameroonGazette: (id: number) => Promise<void>
  clearCameroonGazette: () => Promise<void>
}

const UseCasesContext = createContext<UseCasesValue | null>(null)

function UseCasesProvider({ children }: { children: ReactNode }): ReactElement {
  const textAnalysisList = useLiveQuery(() => database.textAnalysises.toArray())
  const cameroonGazetteList = useLiveQuery(() =>
    database.cameroonGazettes.toArray()
  )

  // TESTLOG

  const createOrUpdateTextAnalysis = async (
    textAnalysis: TextAnalysisUseCaseData
  ) => {
    if (!textAnalysis.job || !textAnalysis.job.jobId) {
      LoggerInstance.error(
        `[UseCases] cannot insert without job or result data!`
      )
      return
    }

    const exists = textAnalysisList?.find(
      (row) => textAnalysis.job.jobId === row.job.jobId
    )

    const updated = await database.textAnalysises.put(
      {
        ...textAnalysis
      },
      exists?.id
    )

    LoggerInstance.log(`[UseCases]: create or update textAnalysis table`, {
      textAnalysis,
      updated
    })

    return updated
  }

  const updateTextAnalysis = async (
    textAnalysises: TextAnalysisUseCaseData[]
  ): Promise<IndexableType> => {
    const updated = await database.textAnalysises.bulkPut(textAnalysises)

    LoggerInstance.log(`[UseCases]: update textAnalysis table`, {
      textAnalysises,
      updated
    })

    return updated
  }

  const deleteTextAnalysis = async (id: number) => {
    await database.textAnalysises.delete(id)

    LoggerInstance.log(`[UseCases]: deleted #${id} from textAnalysis table`)
  }

  const clearTextAnalysis = async () => {
    await database.textAnalysises.clear()

    LoggerInstance.log(`[UseCases]: cleared textAnalysis table`)
  }

  // Cameroon Gazette CRUD
  const createOrUpdateCameroonGazette = async (
    cameroon: CameroonGazetteUseCaseData
  ) => {
    if (!cameroon.job || !cameroon.job.jobId) {
      LoggerInstance.error(
        `[UseCases] cannot insert CameroonGazette without job or result data!`
      )
      return
    }

    const exists = cameroonGazetteList?.find(
      (row) => cameroon.job.jobId === row.job.jobId
    )

    const updated = await database.cameroonGazettes.put(
      {
        ...cameroon
      },
      exists?.id
    )

    LoggerInstance.log(`[UseCases]: create or update CameroonGazette table`, {
      cameroon,
      updated
    })

    return updated
  }

  const updateCameroonGazette = async (
    cameroons: CameroonGazetteUseCaseData[]
  ): Promise<IndexableType> => {
    const updated = await database.cameroonGazettes.bulkPut(cameroons)

    LoggerInstance.log(`[UseCases]: update CameroonGazette table`, {
      cameroons,
      updated
    })

    return updated
  }

  const deleteCameroonGazette = async (id: number) => {
    await database.cameroonGazettes.delete(id)

    LoggerInstance.log(`[UseCases]: deleted #${id} from CameroonGazette table`)
  }

  const clearCameroonGazette = async () => {
    await database.cameroonGazettes.clear()

    LoggerInstance.log(`[UseCases]: cleared CameroonGazette table`)
  }

  return (
    <UseCasesContext.Provider
      value={
        {
          createOrUpdateTextAnalysis,
          textAnalysisList,
          updateTextAnalysis,
          deleteTextAnalysis,
          clearTextAnalysis,
          // Cameroon Gazette
          createOrUpdateCameroonGazette,
          cameroonGazetteList,
          updateCameroonGazette,
          deleteCameroonGazette,
          clearCameroonGazette
        } satisfies UseCasesValue
      }
    >
      {children}
    </UseCasesContext.Provider>
  )
}

// Helper hook to access the provider values
const useUseCases = (): UseCasesValue => {
  const context = useContext(UseCasesContext)
  if (!context) {
    throw new Error('useUseCases must be used within a UseCasesProvider')
  }
  return context
}

export { UseCasesProvider, useUseCases }
