import { ReactElement } from 'react'
import Chatbot from '../@shared/Chatbot'
import { ARST_CHATBOT_ALGO_DIDS, CHATBOT_NAMESPACE } from './_constants'

export default function ChatbotARST(): ReactElement {
  return (
    <Chatbot
      algoDidsByChain={ARST_CHATBOT_ALGO_DIDS}
      namespace={CHATBOT_NAMESPACE}
    />
  )
}
