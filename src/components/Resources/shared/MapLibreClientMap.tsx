import { ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MapPinIcon as HeroMapPin } from '@heroicons/react/24/solid'
import { PlusIcon, MinusIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import maplibregl, { LngLatBoundsLike, Map } from 'maplibre-gl'

interface MarkerData {
  id: string
  title: string
  position: [number, number] // [lat, lng]
  date: Date
  location: string
  type: 'in-person' | 'online' | 'hybrid'
}

interface MapLibreClientMapProps {
  markers: MarkerData[]
  focus?: { lat: number; lng: number } | null
  autoTourEnabled?: boolean
}

export default function MapLibreClientMap({
  markers,
  focus = null,
  autoTourEnabled = true
}: MapLibreClientMapProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Tour state management with refs for latest values
  const tourIndexRef = useRef<number>(0)
  const tourTimersRef = useRef<number[]>([])
  const isPausedRef = useRef<boolean>(false)
  const markersRef = useRef<MarkerData[]>(markers)
  const autoTourEnabledRef = useRef<boolean>(autoTourEnabled)

  const center: [number, number] = useMemo(() => {
    if (markers.length > 0)
      return [markers[0].position[1], markers[0].position[0]]
    return [-0.1278, 51.5074] // [lng, lat] London fallback
  }, [markers])

  const createMarkerElement = (marker: MarkerData): HTMLElement => {
    const color =
      (process.env.NEXT_PUBLIC_MAP_MARKER_COLOR as string) || '#0ea5e9' // default sky-500
    const size = Number(process.env.NEXT_PUBLIC_MAP_MARKER_SIZE || '28')
    const el = document.createElement('div')
    el.style.width = `${size}px`
    el.style.height = `${size}px`
    el.style.color = color
    el.style.display = 'grid'
    el.style.placeItems = 'center'
    el.style.willChange = 'transform'
    el.style.filter = 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))'
    el.setAttribute('role', 'img')
    el.setAttribute('aria-label', marker.title)
    // Render Heroicons solid MapPin into this element
    const root = createRoot(el)
    root.render(<HeroMapPin width={size} height={size} />)
    return el
  }

  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return

    const styleUrl =
      process.env.NEXT_PUBLIC_MAP_STYLE_URL ||
      'https://tiles.openfreemap.org/styles/bright'

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center,
      zoom: 3,
      logoPosition: 'top-right',
      attributionControl: { compact: false }
    })

    mapRef.current = map
    map.on('style.load', () => {
      try {
        // Force flat map; remove sky background if present
        map.setProjection({ type: 'mercator' })
        if (map.getLayer('sky')) {
          map.removeLayer('sky')
        }
      } catch {
        // ignore
      }
    })

    map.on('error', (e: maplibregl.ErrorEvent) => {
      // Capture style/tiles errors
      if (e && e.error && e.error.message) {
        setErrorMsg(e.error.message)
      }
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [center])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove existing markers
    const mapWithMarkers = mapRef.current as unknown as {
      __eventMarkers?: maplibregl.Marker[]
    }
    const existing = mapWithMarkers.__eventMarkers
    if (existing) existing.forEach((m) => m.remove())

    const created: maplibregl.Marker[] = []
    markers.forEach((m) => {
      const el = createMarkerElement(m)
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([m.position[1], m.position[0]])
        .setPopup(
          new maplibregl.Popup({ closeButton: false, offset: 12 }).setHTML(
            `<div style="min-width:180px"><div style="font-weight:600">${
              m.title
            }</div><div style="font-size:12px;color:#4b5563">${m.date.toLocaleDateString(
              'en-US',
              { month: 'short', day: 'numeric', year: 'numeric' }
            )}</div><div style="font-size:12px">${m.location}</div></div>`
          )
        )
        .addTo(map)
      created.push(marker)
    })
    mapWithMarkers.__eventMarkers = created

    // Auto-fit view to show all markers when no specific focus is set
    if (!focus && markers.length > 0) {
      if (markers.length === 1) {
        // Single marker: center on it with reasonable zoom
        const marker = markers[0]
        map.flyTo({
          center: [marker.position[1], marker.position[0]],
          zoom: 8,
          duration: 500,
          essential: true
        })
      } else {
        // Multiple markers: fit bounds to show all
        const first: [number, number] = [
          markers[0].position[1],
          markers[0].position[0]
        ]
        const initial = new maplibregl.LngLatBounds(first, first)
        const bounds = markers.reduce((acc, m) => {
          acc.extend([m.position[1], m.position[0]])
          return acc
        }, initial) as unknown as LngLatBoundsLike
        map.fitBounds(bounds as maplibregl.LngLatBoundsLike, {
          padding: 40,
          duration: 500
        })
      }
    }

    // If there's a specific focus, override auto-fit behavior
    if (focus) {
      map.flyTo({
        center: [focus.lng, focus.lat],
        zoom: 12,
        duration: 900,
        essential: true
      })
    }
  }, [markers, focus])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !focus) return
    map.flyTo({
      center: [focus.lng, focus.lat],
      zoom: 12,
      duration: 900,
      essential: true
    })
  }, [focus])

  // Update refs when props change
  useEffect(() => {
    markersRef.current = markers
    autoTourEnabledRef.current = autoTourEnabled
  }, [markers, autoTourEnabled])

  // Tour management effect - clean separation of concerns
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const startDelay = Number(
      process.env.NEXT_PUBLIC_MAP_TOUR_START_MS || '3000'
    )
    const flyDuration = Number(process.env.NEXT_PUBLIC_MAP_TOUR_FLY_MS || '900')
    const holdDuration = Number(
      process.env.NEXT_PUBLIC_MAP_TOUR_HOLD_MS || '4500'
    )
    const resumeDelay = Number(
      process.env.NEXT_PUBLIC_MAP_TOUR_RESUME_MS || '10000'
    )
    const tourZoom = Number(process.env.NEXT_PUBLIC_MAP_TOUR_ZOOM || '15')

    const clearAllTimers = () => {
      tourTimersRef.current.forEach((id) => window.clearTimeout(id))
      tourTimersRef.current = []
    }

    const stopTour = () => {
      isPausedRef.current = true
      clearAllTimers()
    }

    const scheduleNext = (delayMs: number) => {
      if (!mapRef.current || isPausedRef.current) return
      const id = window.setTimeout(() => {
        if (!mapRef.current || isPausedRef.current) return
        // Always use the latest markers from ref
        const currentMarkers = markersRef.current
        const currentAutoTourEnabled = autoTourEnabledRef.current

        if (!currentAutoTourEnabled || currentMarkers.length <= 1) return

        // Ensure index is within bounds
        if (tourIndexRef.current >= currentMarkers.length) {
          tourIndexRef.current = 0
        }

        const idx = tourIndexRef.current % currentMarkers.length
        const target = currentMarkers[idx]
        tourIndexRef.current = (idx + 1) % currentMarkers.length
        mapRef.current.flyTo({
          center: [target.position[1], target.position[0]],
          zoom: tourZoom,
          duration: flyDuration,
          essential: true,
          curve: 1.4
        })
        scheduleNext(flyDuration + holdDuration)
      }, delayMs)
      tourTimersRef.current.push(id)
    }

    const resumeTour = () => {
      const currentMarkers = markersRef.current
      if (currentMarkers.length <= 1) return

      isPausedRef.current = false
      clearAllTimers()
      scheduleNext(startDelay)
    }

    const initializeTour = () => {
      const currentMarkers = markersRef.current
      const currentAutoTourEnabled = autoTourEnabledRef.current

      // Reset tour state
      tourIndexRef.current = 0
      isPausedRef.current = false

      // Start tour if conditions are met
      if (currentAutoTourEnabled && currentMarkers.length > 1) {
        // Delay start to let map view settle
        const startId = window.setTimeout(() => {
          if (mapRef.current && !isPausedRef.current) {
            scheduleNext(startDelay)
          }
        }, 800)
        tourTimersRef.current.push(startId)
      }
    }

    // Clean up any existing tour
    stopTour()

    // Initialize new tour
    initializeTour()

    const onInteractStart = () => {
      stopTour()
      window.setTimeout(() => {
        if (document.visibilityState === 'visible') {
          resumeTour()
        }
      }, resumeDelay)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        stopTour()
      } else {
        onInteractStart()
      }
    }

    map.on('dragstart', onInteractStart)
    map.on('zoomstart', onInteractStart)
    map.on('mousedown', onInteractStart)
    map.on('touchstart', onInteractStart)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearAllTimers()
      map.off('dragstart', onInteractStart)
      map.off('zoomstart', onInteractStart)
      map.off('mousedown', onInteractStart)
      map.off('touchstart', onInteractStart)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [markers, autoTourEnabled])

  return (
    <div
      ref={containerRef}
      className="events-map"
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {/* Custom Map Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          zIndex: 2,
          background: 'rgba(255,255,255,0.55)',
          border: '1px solid rgba(17,24,39,0.12)',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
          backdropFilter: 'saturate(1.8) blur(10px)',
          WebkitBackdropFilter: 'saturate(1.8) blur(10px)'
        }}
        aria-label="Map controls"
      >
        <button
          type="button"
          title="Zoom in"
          onClick={() => mapRef.current?.zoomIn({ duration: 250 })}
          style={{
            width: 32,
            height: 32,
            display: 'grid',
            placeItems: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <PlusIcon
            width={16}
            height={16}
            className="text-gray-800"
            strokeWidth={3}
          />
        </button>
        <div style={{ height: 1, background: 'rgba(17,24,39,0.08)' }} />
        <button
          type="button"
          title="Zoom out"
          onClick={() => mapRef.current?.zoomOut({ duration: 250 })}
          style={{
            width: 32,
            height: 32,
            display: 'grid',
            placeItems: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <MinusIcon
            width={16}
            height={16}
            className="text-gray-800"
            strokeWidth={2}
          />
        </button>
        <div style={{ height: 1, background: 'rgba(17,24,39,0.08)' }} />
        <button
          type="button"
          title="Reset view"
          onClick={() => {
            const map = mapRef.current
            if (!map) return
            if (markers.length > 1) {
              const first: [number, number] = [
                markers[0].position[1],
                markers[0].position[0]
              ]
              const initial = new maplibregl.LngLatBounds(first, first)
              const bounds = markers.reduce((acc, m) => {
                acc.extend([m.position[1], m.position[0]])
                return acc
              }, initial) as unknown as LngLatBoundsLike
              map.fitBounds(bounds as maplibregl.LngLatBoundsLike, {
                padding: 40,
                duration: 300
              })
            } else {
              map.flyTo({ center, zoom: 3, duration: 300, essential: true })
            }
          }}
          style={{
            width: 32,
            height: 32,
            display: 'grid',
            placeItems: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <ArrowPathIcon
            width={16}
            height={16}
            className="text-gray-800"
            strokeWidth={2}
          />
        </button>
      </div>
      {errorMsg && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.9)',
            color: '#b45309',
            fontSize: 14,
            padding: 16,
            textAlign: 'center'
          }}
        >
          {errorMsg}
        </div>
      )}
      <style>
        {`
        .events-map .maplibregl-ctrl-attrib {
          font-size: 11px;
          color: #374151;
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(17,24,39,0.12);
          border-radius: 8px;
          padding: 4px 8px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
          backdrop-filter: saturate(1.8) blur(8px);
          -webkit-backdrop-filter: saturate(1.8) blur(8px);
        }
        .events-map .maplibregl-ctrl-attrib a {
          color: #1f2937;
          text-decoration: none;
        }
        .events-map .maplibregl-ctrl-attrib a:hover {
          text-decoration: underline;
        }
        `}
      </style>
    </div>
  )
}
