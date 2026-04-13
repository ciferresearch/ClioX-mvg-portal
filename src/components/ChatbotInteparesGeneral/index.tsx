import { ReactElement } from 'react'
import Chatbot from '../@shared/Chatbot'
import {
  INTEPARES_GENERAL_CHATBOT_ALGO_DIDS,
  INTEPARES_GENERAL_CHATBOT_DATASET_DIDS,
  CHATBOT_NAMESPACE
} from './_constants'

export default function ChatbotInteparesGeneral(): ReactElement {
  return (
    <Chatbot
      algoDidsByChain={INTEPARES_GENERAL_CHATBOT_ALGO_DIDS}
      datasetDidsByChain={INTEPARES_GENERAL_CHATBOT_DATASET_DIDS}
      namespace={CHATBOT_NAMESPACE}
    />
  )
}
