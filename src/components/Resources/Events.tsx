import { ReactElement, useState, useMemo } from 'react'
import { motion } from 'motion/react'
import * as Select from '@radix-ui/react-select'
import * as Checkbox from '@radix-ui/react-checkbox'
import * as Separator from '@radix-ui/react-separator'
import * as Collapsible from '@radix-ui/react-collapsible'
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import EventsMap from './shared/EventsMap'

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

interface EventsProps {
  events?: Event[]
}

// Sample events data - in real app this would come from props or API
const sampleEvents: Event[] = [
  {
    id: 'evt-001',
    title: 'Clio-X Summit',
    date: new Date(new Date().getFullYear(), 9, 5),
    location: 'San Francisco, CA',
    type: 'in-person',
    description:
      'A full-day summit focused on privacy-preserving technologies and governance best practices.',
    link: 'https://example.com/events/cliox-summit',
    lat: 37.7749,
    lng: -122.4194
  },
  {
    id: 'evt-002',
    title: 'Zero-Knowledge Bootcamp',
    date: new Date(new Date().getFullYear(), 8, 20),
    location: 'Online',
    type: 'online',
    description:
      'Hands-on workshop covering zk basics, tooling, and practical applications.',
    link: 'https://example.com/events/zk-bootcamp'
  },
  {
    id: 'evt-003',
    title: 'Governance & Privacy Forum',
    date: new Date(new Date().getFullYear() + 1, 2, 12),
    location: 'London, UK & Online',
    type: 'hybrid',
    description:
      'Hybrid forum exploring privacy, governance, and education initiatives in decentralized systems.',
    link: 'https://example.com/events/governance-privacy-forum',
    lat: 51.5074,
    lng: -0.1278
  },
  {
    id: 'evt-004',
    title: 'Past Year Recap Webinar',
    date: new Date(new Date().getFullYear() - 1, 11, 15),
    location: 'Online',
    type: 'online',
    description:
      'A recap of last year’s milestones, research highlights, and community updates.',
    link: 'https://example.com/events/recap-webinar'
  }
]

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

export default function Events({
  events = sampleEvents
}: EventsProps): ReactElement {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState<string>('all-years')
  const [selectedMonth, setSelectedMonth] = useState<string>('all-months')
  const [showInPerson, setShowInPerson] = useState(false)
  const [showOnline, setShowOnline] = useState(false)
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past'>('upcoming')

  const filteredEvents = useMemo(() => {
    const now = new Date()

    return events.filter((event) => {
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
  }, [
    events,
    searchTerm,
    selectedYear,
    selectedMonth,
    showInPerson,
    showOnline,
    timeFilter
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-base text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Year Select */}
          <Select.Root value={selectedYear} onValueChange={setSelectedYear}>
            <Select.Trigger className="inline-flex items-center justify-between w-32 px-3 py-2 text-base bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
              <Select.Value placeholder="Year" />
              <Select.Icon>
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <Select.Viewport className="p-1">
                  <Select.Item
                    value="all-years"
                    className="relative flex items-center px-3 py-2 text-base text-gray-700 cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  >
                    <Select.ItemText>All Years</Select.ItemText>
                  </Select.Item>
                  {years.map((year) => (
                    <Select.Item
                      key={year}
                      value={year.toString()}
                      className="relative flex items-center px-3 py-2 text-base text-gray-700 cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      <Select.ItemText>{year}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>

          {/* Month Select */}
          <Select.Root value={selectedMonth} onValueChange={setSelectedMonth}>
            <Select.Trigger className="inline-flex items-center justify-between w-36 px-3 py-2 text-base bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
              <Select.Value placeholder="Month" />
              <Select.Icon>
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <Select.Viewport className="p-1">
                  <Select.Item
                    value="all-months"
                    className="relative flex items-center px-3 py-2 text-base text-gray-700 cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  >
                    <Select.ItemText>All Months</Select.ItemText>
                  </Select.Item>
                  {months.map((month) => (
                    <Select.Item
                      key={month}
                      value={month}
                      className="relative flex items-center px-3 py-2 text-base text-gray-700 cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      <Select.ItemText>{month}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>

          {/* Checkboxes */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-base text-gray-700 cursor-pointer">
              <Checkbox.Root
                checked={showInPerson}
                onCheckedChange={(checked) => setShowInPerson(!!checked)}
                className="flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
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
                className="flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
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
        <EventsMap events={filteredEvents} />
      </motion.div>

      {/* Events Table Section */}
      <motion.div variants={itemVariants}>
        {/* Time Filter Controls */}
        <div className="flex mb-4">
          <button
            onClick={() => setTimeFilter('upcoming')}
            className={`px-6 py-2.5 text-base font-semibold rounded-l-md transition-colors duration-200 ${
              timeFilter === 'upcoming'
                ? 'bg-amber-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setTimeFilter('past')}
            className={`px-6 py-2.5 text-base font-semibold rounded-r-md transition-colors duration-200 ${
              timeFilter === 'past'
                ? 'bg-amber-700 text-white'
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
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </span>
              </div>
              <div className="col-span-6 sm:col-span-7">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Event Name
                </span>
              </div>
              <div className="col-span-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Location
                </span>
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
                    {/* Main Event Row */}
                    <div className="px-4 py-4 hover:bg-gray-50 transition-colors duration-150">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Date Column */}
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

                        {/* Event Name Column */}
                        <div className="col-span-6 sm:col-span-7">
                          {event.link ? (
                            <a
                              href={event.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-base font-semibold text-gray-900 hover:text-amber-700 transition-colors duration-200 block truncate"
                            >
                              {event.title}
                            </a>
                          ) : (
                            <span className="text-base font-semibold text-gray-900 block truncate">
                              {event.title}
                            </span>
                          )}
                          {/* Description for mobile */}
                          {event.description && (
                            <p className="mt-1 text-sm text-gray-600 line-clamp-1 sm:hidden">
                              {event.description}
                            </p>
                          )}
                        </div>

                        {/* Location Column */}
                        <div className="col-span-3 flex items-center justify-start gap-2">
                          <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0 m-0" />
                          <span className="text-sm text-gray-700 truncate">
                            {event.location}
                          </span>
                        </div>
                      </div>

                      {/* Expandable Description for Desktop */}
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
                        className="text-amber-700 font-semibold underline hover:text-amber-800"
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
