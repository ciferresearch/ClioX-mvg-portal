import {
  CAMEROON_CHATBOT_ALGO_DIDS,
  CHATBOT_NAMESPACE as CAMEROON_NAMESPACE
} from '../ChatbotCameroon/_constants'

import {
  INTEPARES_GENERAL_CHATBOT_ALGO_DIDS,
  CHATBOT_NAMESPACE as INTEPARES_GENERAL_NAMESPACE
} from '../ChatbotInteparesGeneral/_constants'

import {
  UDL_CHATBOT_ALGO_DIDS,
  CHATBOT_NAMESPACE as UDL_NAMESPACE
} from '../ChatbotUdL/_constants'

import {
  ARST_CHATBOT_ALGO_DIDS,
  CHATBOT_NAMESPACE as ARST_NAMESPACE
} from '../ChatbotARST/_constants'

export interface ChatbotProject {
  id: string
  name: string
  namespace: string
  algoDidsByChain: Record<number, string | string[]>
}

export const CHATBOT_PROJECTS: ChatbotProject[] = [
  {
    id: 'cameroon',
    name: 'Cameroon',
    namespace: CAMEROON_NAMESPACE,
    algoDidsByChain: CAMEROON_CHATBOT_ALGO_DIDS
  },
  {
    id: 'intepares',
    name: 'InterPARES',
    namespace: INTEPARES_GENERAL_NAMESPACE,
    algoDidsByChain: INTEPARES_GENERAL_CHATBOT_ALGO_DIDS
  },
  {
    id: 'udl',
    name: 'UdL',
    namespace: UDL_NAMESPACE,
    algoDidsByChain: UDL_CHATBOT_ALGO_DIDS
  },
  {
    id: 'arst',
    name: 'ARST',
    namespace: ARST_NAMESPACE,
    algoDidsByChain: ARST_CHATBOT_ALGO_DIDS
  }
]
