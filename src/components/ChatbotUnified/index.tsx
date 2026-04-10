import { ReactElement, useMemo, useState } from 'react'
import Chatbot from '../@shared/Chatbot'
import { useUseCases } from '../../@context/UseCases'
import { chatbotApi } from '../../@utils/chatbot'
import { CHATBOT_PROJECTS, ChatbotProject } from './_constants'

export default function ChatbotUnified(): ReactElement {
  const { clearChatbotByNamespace } = useUseCases()
  const [selectedId, setSelectedId] = useState<string>(
    CHATBOT_PROJECTS[0]?.id || ''
  )

  const selectedProject = useMemo<ChatbotProject | undefined>(() => {
    return CHATBOT_PROJECTS.find((project) => project.id === selectedId)
  }, [selectedId])

  const handleSelect = async (project: ChatbotProject) => {
    if (project.id === selectedId) return
    const current = selectedProject
    if (current) {
      await clearChatbotByNamespace(current.namespace)
    }
    chatbotApi.clearSession()
    setSelectedId(project.id)
  }

  if (!selectedProject) {
    return <div>Chatbot project not found.</div>
  }

  return (
    <div className="flex gap-8 items-start">
      <aside className="w-[280px] shrink-0">
        <div className="text-sm uppercase tracking-wide text-gray-500 mb-3">
          Projects
        </div>
        <div className="flex flex-col gap-2">
          {CHATBOT_PROJECTS.map((project) => {
            const isActive = project.id === selectedProject.id
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => handleSelect(project)}
                className={`text-left w-full px-3 py-2 rounded-md border transition ${
                  isActive
                    ? 'border-black text-black bg-white'
                    : 'border-transparent text-gray-600 hover:text-black hover:bg-gray-100'
                }`}
              >
                {project.name}
              </button>
            )
          })}
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <Chatbot
          key={selectedProject.namespace}
          algoDidsByChain={selectedProject.algoDidsByChain}
          datasetDidsByChain={selectedProject.datasetDidsByChain}
          namespace={selectedProject.namespace}
        />
      </div>
    </div>
  )
}
