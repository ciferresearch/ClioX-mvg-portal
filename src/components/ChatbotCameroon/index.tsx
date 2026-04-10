import { ReactElement } from 'react'
import Chatbot from '../@shared/Chatbot'
import {
  CAMEROON_CHATBOT_ALGO_DIDS,
  CAMEROON_CHATBOT_DATASET_DIDS,
  CHATBOT_NAMESPACE
} from './_constants'

export default function ChatbotCameroon(): ReactElement {
  return (
    <Chatbot
      algoDidsByChain={CAMEROON_CHATBOT_ALGO_DIDS}
      datasetDidsByChain={CAMEROON_CHATBOT_DATASET_DIDS}
      namespace={CHATBOT_NAMESPACE}
    />
  )
}
