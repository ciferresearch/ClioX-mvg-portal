import { ReactElement } from 'react'
import Chatbot from '../@shared/Chatbot'
import {
  UDL_CHATBOT_ALGO_DIDS,
  UDL_CHATBOT_DATASET_DIDS,
  CHATBOT_NAMESPACE
} from './_constants'

export default function ChatbotUdL(): ReactElement {
  return (
    <Chatbot
      algoDidsByChain={UDL_CHATBOT_ALGO_DIDS}
      datasetDidsByChain={UDL_CHATBOT_DATASET_DIDS}
      namespace={CHATBOT_NAMESPACE}
    />
  )
}
