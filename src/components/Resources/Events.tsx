import { ReactElement, useState, useMemo, useEffect } from 'react'
import { motion } from 'motion/react'
// import * as Select from '@radix-ui/react-select'
import * as Checkbox from '@radix-ui/react-checkbox'
import * as Separator from '@radix-ui/react-separator'
import * as Collapsible from '@radix-ui/react-collapsible'
import {
  MagnifyingGlassIcon,
  CheckIcon,
  MapPinIcon,
  CalendarIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline'
import EventsMap from './shared/EventsMap'
import CustomDropdown from './shared/CustomDropdown'

interface Event {
  id: string
  title: string
  date: Date
  location: string
  type: 'in-person' | 'online' | 'hybrid'
  description?: string
  link?: string
  lat?: number
  lng?: number
}

interface EventsJsonItem {
  id: string
  category: string
  tag: string
  title: string
  description: string
  image: string
  link: string
  content?: string
  tags?: string[]
  eventDate: string
  endDate?: string
  timezone?: string
  location: string
  eventType: 'in-person' | 'online' | 'hybrid'
  lat?: number
  lng?: number
  registrationUrl?: string
  registrationRequired?: boolean
  price?: string
  organizer?: string
  venueName?: string
  speakers?: string[]
  status?: 'scheduled' | 'completed' | 'cancelled'
}

interface EventsProps {
  events?: Event[]
}

// All events are loaded from content JSON; optional `events` prop can provide fallback

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear + i)
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

type SortBy = 'date' | 'title' | 'location'
type SortDir = 'asc' | 'desc'

export default function Events({ events = [] }: EventsProps): ReactElement {
  const [eventsList, setEventsList] = useState<Event[]>(events)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState<string>('all-years')
  const [selectedMonth, setSelectedMonth] = useState<string>('all-months')
  const [showInPerson, setShowInPerson] = useState(false)
  const [showOnline, setShowOnline] = useState(false)
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past'>('upcoming')
  const [mapFocus, setMapFocus] = useState<{ lat: number; lng: number } | null>(
    null
  )
  const [searchIdle, setSearchIdle] = useState(false)
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortDir('asc')
    }
  }
  useEffect(() => {
    setSearchIdle(false)
    const delay = Number(
      process.env.NEXT_PUBLIC_MAP_TOUR_SEARCH_IDLE_MS || '4000'
    )
    if (searchTerm.trim() === '') return
    const id = window.setTimeout(() => setSearchIdle(true), delay)
    return () => window.clearTimeout(id)
  }, [searchTerm])

  // Load events from JSON for search and display
  useEffect(() => {
    const loadFromJson = async () => {
      try {
        // Use dynamic import so JSON is bundled and available client-side
        const mod = await import('../../../content/resources/events/index.json')
        const dataModule = mod as unknown as
          | { default: { events?: EventsJsonItem[] } }
          | { events?: EventsJsonItem[] }
        const data: { events?: EventsJsonItem[] } =
          'default' in dataModule ? dataModule.default : dataModule
        const items: EventsJsonItem[] = data?.events || []
        const mapped: Event[] = items
          .map((it) => ({
            id: it.id,
            title: it.title,
            date: new Date(it.eventDate),
            location: it.location,
            type: it.eventType,
            description: it.description,
            link: it.link,
            lat: it.lat,
            lng: it.lng
          }))
          // filter out invalid dates
          .filter((ev) => !isNaN(ev.date.getTime()))
        if (mapped.length > 0) setEventsList(mapped)
      } catch (e) {
        // keep fallback sample events
      }
    }
    loadFromJson()
  }, [])

  const filteredEvents = useMemo(() => {
    const now = new Date()

    const filtered = eventsList.filter((event) => {
      // Time filter
      const isUpcoming = event.date >= now
      if (timeFilter === 'upcoming' && !isUpcoming) return false
      if (timeFilter === 'past' && isUpcoming) return false

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch =
          event.title.toLowerCase().includes(searchLower) ||
          event.location.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Year filter
      if (selectedYear && selectedYear !== 'all-years') {
        if (event.date.getFullYear().toString() !== selectedYear) return false
      }

      // Month filter
      if (selectedMonth && selectedMonth !== 'all-months') {
        const monthIndex = months.indexOf(selectedMonth)
        if (event.date.getMonth() !== monthIndex) return false
      }

      // Type filter
      if (showInPerson || showOnline) {
        if (showInPerson && !showOnline) {
          return event.type === 'in-person' || event.type === 'hybrid'
        }
        if (showOnline && !showInPerson) {
          return event.type === 'online' || event.type === 'hybrid'
        }
      }

      return true
    })

    const compare = (a: Event, b: Event) => {
      let result = 0
      if (sortBy === 'date') {
        result = a.date.getTime() - b.date.getTime()
      } else if (sortBy === 'title') {
        result = a.title.localeCompare(b.title)
      } else if (sortBy === 'location') {
        result = a.location.localeCompare(b.location)
      }
      return sortDir === 'asc' ? result : -result
    }

    return filtered.sort(compare)
  }, [
    eventsList,
    searchTerm,
    selectedYear,
    selectedMonth,
    showInPerson,
    showOnline,
    timeFilter,
    sortBy,
    sortDir
  ])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Filter Bar */}
      <motion.div
        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
        variants={itemVariants}
      >
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-base font-semibold text-gray-900 flex-shrink-0">
            Explore Events
          </span>

          {/* Search Input */}
          <div className="relative flex-grow min-w-[200px] max-w-[300px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Location or name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-base text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-gray-300"
            />
          </div>

          {/* Year Select - Custom Dropdown */}
          <CustomDropdown
            id="events-year"
            value={selectedYear}
            onChange={setSelectedYear}
            widthClass="w-32"
            options={[
              { value: 'all-years', label: 'All Years' },
              ...years.map((y) => ({
                value: y.toString(),
                label: y.toString()
              }))
            ]}
          />

          {/* Month Select - Custom Dropdown */}
          <CustomDropdown
            id="events-month"
            value={selectedMonth}
            onChange={setSelectedMonth}
            widthClass="w-36"
            options={[
              { value: 'all-months', label: 'All Months' },
              ...months.map((m) => ({ value: m, label: m }))
            ]}
          />

          {/* Checkboxes */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-base text-gray-700 cursor-pointer">
              <Checkbox.Root
                checked={showInPerson}
                onCheckedChange={(checked) => setShowInPerson(!!checked)}
                className="flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-white hover:border-gray-400 focus:outline-none data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600 cursor-pointer"
              >
                <Checkbox.Indicator>
                  <CheckIcon className="h-3 w-3 text-white" />
                </Checkbox.Indicator>
              </Checkbox.Root>
              In-Person
            </label>

            <label className="flex items-center gap-2 text-base text-gray-700 cursor-pointer">
              <Checkbox.Root
                checked={showOnline}
                onCheckedChange={(checked) => setShowOnline(!!checked)}
                className="flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-white hover:border-gray-400 focus:outline-none data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600 cursor-pointer"
              >
                <Checkbox.Indicator>
                  <CheckIcon className="h-3 w-3 text-white" />
                </Checkbox.Indicator>
              </Checkbox.Root>
              Online
            </label>
          </div>
        </div>
      </motion.div>

      {/* Map Container */}
      <motion.div
        className="w-full h-80 rounded-lg overflow-hidden shadow-md"
        variants={itemVariants}
      >
        <EventsMap
          events={filteredEvents}
          focus={mapFocus}
          autoTourEnabled={
            !mapFocus && (searchTerm.trim() === '' ? true : searchIdle)
          }
        />
      </motion.div>

      {/* Events Table Section */}
      <motion.div variants={itemVariants}>
        {/* Time Filter Controls */}
        <div className="flex mb-4">
          <button
            onClick={() => setTimeFilter('upcoming')}
            className={`px-6 py-2.5 text-base font-semibold rounded-l-md transition-colors cursor-pointer duration-200 ${
              timeFilter === 'upcoming'
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setTimeFilter('past')}
            className={`px-6 py-2.5 text-base font-semibold rounded-r-md transition-colors cursor-pointer duration-200 ${
              timeFilter === 'past'
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Past
          </button>
        </div>

        {/* Events List with Radix Components */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Table Headers */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => handleSort('date')}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 cursor-pointer"
                >
                  <span>Date</span>
                  {sortBy !== 'date' ? (
                    <ArrowsUpDownIcon className="h-3.5 w-3.5" />
                  ) : sortDir === 'asc' ? (
                    <ChevronUpIcon className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDownIcon className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <div className="col-span-6 sm:col-span-7">
                <button
                  type="button"
                  onClick={() => handleSort('title')}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 cursor-pointer"
                >
                  <span>Event Name</span>
                  {sortBy !== 'title' ? (
                    <ArrowsUpDownIcon className="h-3.5 w-3.5" />
                  ) : sortDir === 'asc' ? (
                    <ChevronUpIcon className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDownIcon className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <div className="col-span-3">
                <button
                  type="button"
                  onClick={() => handleSort('location')}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 cursor-pointer"
                >
                  <span>Location</span>
                  {sortBy !== 'location' ? (
                    <ArrowsUpDownIcon className="h-3.5 w-3.5" />
                  ) : sortDir === 'asc' ? (
                    <ChevronUpIcon className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDownIcon className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="divide-y divide-gray-200">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event, index) => (
                <Collapsible.Root key={event.id}>
                  <motion.div
                    className="group"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      className="px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      onClick={() => {
                        if (event.lat != null && event.lng != null) {
                          setMapFocus({ lat: event.lat, lng: event.lng })
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          if (event.lat != null && event.lng != null) {
                            setMapFocus({ lat: event.lat, lng: event.lng })
                          }
                        }
                      }}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3 sm:col-span-2">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0 m-0" />
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {event.date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="col-span-6 sm:col-span-7">
                          <span className="text-base font-semibold text-gray-900 block truncate group-hover:text-amber-700 transition-colors duration-200">
                            {event.title}
                          </span>
                          {event.description && (
                            <p className="mt-1 text-sm text-gray-600 line-clamp-1 sm:hidden">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <div className="col-span-3 flex items-center justify-start gap-2">
                          <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0 m-0" />
                          <span className="text-sm text-gray-700 truncate">
                            {event.location}
                          </span>
                        </div>
                      </div>
                      {event.description && (
                        <Collapsible.Content className="hidden sm:block mt-3 pl-6">
                          <Separator.Root className="my-2 h-px bg-gray-200" />
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {event.description}
                          </p>
                        </Collapsible.Content>
                      )}
                    </div>
                  </motion.div>
                </Collapsible.Root>
              ))
            ) : (
              <div className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <CalendarIcon className="h-12 w-12 text-gray-300" />
                  <div>
                    <p className="text-lg text-gray-500 font-medium mb-2">
                      No events found
                    </p>
                    <p className="text-gray-400">
                      Please check back soon or{' '}
                      <a
                        href="/#contact"
                        className="text-[var(--color-primary)] font-semibold underline hover:opacity-90"
                      >
                        contact us
                      </a>{' '}
                      about upcoming events.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
