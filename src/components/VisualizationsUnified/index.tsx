import { ReactElement, useMemo, useState } from 'react'
import TextAnalysis from '../TextAnalysis'
import CameroonGazette from '../CameroonGazette'
import { VISUALIZATION_PROJECTS, VisualizationProject } from './_constants'

export default function VisualizationsUnified(): ReactElement {
  const [selectedId, setSelectedId] = useState<string>(
    VISUALIZATION_PROJECTS[0]?.id || ''
  )

  const selectedProject = useMemo<VisualizationProject | undefined>(() => {
    return VISUALIZATION_PROJECTS.find((project) => project.id === selectedId)
  }, [selectedId])

  const renderContent = () => {
    switch (selectedProject?.id) {
      case 'cameroon-gazette':
        return <CameroonGazette key="cameroon-gazette" />
      case 'email-text':
      default:
        return <TextAnalysis key="email-text" />
    }
  }

  if (!selectedProject) {
    return <div>Visualization project not found.</div>
  }

  return (
    <div className="flex gap-8 items-start">
      <aside className="w-[280px] shrink-0">
        <div className="text-sm uppercase tracking-wide text-gray-500 mb-3">
          Projects
        </div>
        <div className="flex flex-col gap-2">
          {VISUALIZATION_PROJECTS.map((project) => {
            const isActive = project.id === selectedProject.id
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => setSelectedId(project.id)}
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

      <div className="flex-1 min-w-0">{renderContent()}</div>
    </div>
  )
}
