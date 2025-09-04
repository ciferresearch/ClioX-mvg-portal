import { ReactElement } from 'react'
import Chatbot from '../@shared/Chatbot'
import { CAMEROON_CHATBOT_ALGO_DIDS, CHATBOT_NAMESPACE } from './_constants'

export default function ChatbotCameroon(): ReactElement {
  return (
    <Chatbot
      algoDidsByChain={CAMEROON_CHATBOT_ALGO_DIDS}
      namespace={CHATBOT_NAMESPACE}
    />
  )
}
