import { ReactElement } from 'react'
import Chatbot from '../@shared/Chatbot'
import { INTEPARES_CHATBOT_ALGO_DIDS, CHATBOT_NAMESPACE } from './_constants'

export default function ChatbotIntepares(): ReactElement {
  return (
    <Chatbot
      algoDidsByChain={INTEPARES_CHATBOT_ALGO_DIDS}
      namespace={CHATBOT_NAMESPACE}
    />
  )
}
