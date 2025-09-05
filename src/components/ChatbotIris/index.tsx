import { ReactElement } from 'react'
import Chatbot from '../@shared/Chatbot'
import { IRIS_CHATBOT_ALGO_DIDS, CHATBOT_NAMESPACE } from './_constants'

export default function ChatbotIris(): ReactElement {
  return (
    <Chatbot
      algoDidsByChain={IRIS_CHATBOT_ALGO_DIDS}
      namespace={CHATBOT_NAMESPACE}
    />
  )
}
