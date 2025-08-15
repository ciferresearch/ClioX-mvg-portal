import { ReactElement, useMemo } from 'react'
import dynamic from 'next/dynamic'

type EventType = 'in-person' | 'online' | 'hybrid'

export interface MappedEvent {
  id: string
  title: string
  date: Date
  location: string
  type: EventType
  lat?: number
  lng?: number
}

const MapImpl = dynamic(
  async () => (await import('./MapLibreClientMap')).default,
  {
    ssr: false
  }
)

interface EventsMapProps {
  events: MappedEvent[]
  focus?: { lat: number; lng: number } | null
  autoTourEnabled?: boolean
}

export default function EventsMap({
  events,
  focus = null,
  autoTourEnabled = true
}: EventsMapProps): ReactElement {
  const markers = useMemo(
    () =>
      events
        .filter((e) => e.type !== 'online' && e.lat != null && e.lng != null)
        .map((e) => ({
          id: e.id,
          title: e.title,
          position: [e.lat as number, e.lng as number] as [number, number],
          date: e.date,
          location: e.location,
          type: e.type
        })),
    [events]
  )

  return (
    <MapImpl
      markers={markers}
      focus={focus ? { lat: focus.lat, lng: focus.lng } : null}
      autoTourEnabled={autoTourEnabled}
    />
  )
}
