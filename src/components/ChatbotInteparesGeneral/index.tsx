import { ReactElement } from 'react'
import Chatbot from '../@shared/Chatbot'
import {
  INTEPARES_GENERAL_CHATBOT_ALGO_DIDS,
  CHATBOT_NAMESPACE
} from './_constants'

export default function ChatbotInteparesGeneral(): ReactElement {
  return (
    <Chatbot
      algoDidsByChain={INTEPARES_GENERAL_CHATBOT_ALGO_DIDS}
      namespace={CHATBOT_NAMESPACE}
    />
  )
}
