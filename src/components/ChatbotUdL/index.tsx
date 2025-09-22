import { ReactElement } from 'react'
import Chatbot from '../@shared/Chatbot'
import { UDL_CHATBOT_ALGO_DIDS, CHATBOT_NAMESPACE } from './_constants'

export default function ChatbotUdL(): ReactElement {
  return (
    <Chatbot
      algoDidsByChain={UDL_CHATBOT_ALGO_DIDS}
      namespace={CHATBOT_NAMESPACE}
    />
  )
}
