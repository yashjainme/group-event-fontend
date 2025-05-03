
"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar as CalendarIconLucide, // Renamed to avoid conflict with potential Calendar component
  Plus,
  X,
  Users,
  Clock,
  MapPin,
  Check,
  LogOut,
  Settings,
  Info,
  ChevronLeft,
  ChevronRight,
  Bell,
  AlertCircle, // Added for potential error messages
} from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isValid, // Added for date validation
  isBefore, // Added for date validation
} from "date-fns"

// --- Mock Data & Types ---

interface Attendee {
  id: string
  name: string
  avatarColor?: string // Optional: For generating consistent avatar colors
}

interface Event {
  id: string
  title: string
  date: string // ISO string format (e.g., "2025-06-15T14:00:00.000Z")
  description: string
  location: string
  attendees: Attendee[]
  maxAttendees?: number
  createdBy: Attendee
}

// Helper to generate simple avatar colors based on name/id
const generateAvatarColor = (id: string): string => {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash // Convert to 32bit integer
  }
  const colors = [
    "bg-red-400", "bg-orange-400", "bg-amber-400", "bg-yellow-400",
    "bg-lime-400", "bg-green-400", "bg-emerald-400", "bg-teal-400",
    "bg-cyan-400", "bg-sky-400", "bg-blue-400", "bg-indigo-400",
    "bg-violet-400", "bg-purple-400", "bg-fuchsia-400", "bg-pink-400",
    "bg-rose-400",
  ]
  const index = Math.abs(hash % colors.length)
  return colors[index]
}


// Mock user (replace with actual user context in a real app)
const mockUser: Attendee = { id: "user1", name: "You", avatarColor: generateAvatarColor("user1") }

// Initial mock events with avatar colors
const initialEvents: Event[] = [
  {
    id: "evt1",
    title: "Team Sync & Lunch",
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 15, 13, 0).toISOString(),
    description: "Quick sync on project updates followed by team lunch.",
    location: "Office Cafeteria & Downtown Deli",
    attendees: [mockUser, { id: "user2", name: "Alice", avatarColor: generateAvatarColor("user2") }],
    maxAttendees: 10,
    createdBy: { id: "user2", name: "Alice", avatarColor: generateAvatarColor("user2") },
  },
  {
    id: "evt2",
    title: "Weekend Hike: Summit Trail",
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 22, 9, 0).toISOString(),
    description: "Challenging but rewarding hike. Pack essentials!",
    location: "Summit Trail Head",
    attendees: [{ id: "user3", name: "Bob", avatarColor: generateAvatarColor("user3") }],
    createdBy: { id: "user3", name: "Bob", avatarColor: generateAvatarColor("user3") },
  },
  {
    id: "evt3",
    title: "Game Night: Strategy Edition",
    date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5, 19, 0).toISOString(),
    description: "Let's play some complex board games. Snacks provided.",
    location: "Community Center Room 3",
    attendees: [mockUser],
    maxAttendees: 8,
    createdBy: mockUser,
  },
    {
    id: "evt4",
    title: "Design Review",
    date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 10, 0).toISOString(), // Event for today
    description: "Review the latest UI mockups.",
    location: "Online Meeting",
    attendees: [mockUser, { id: "user2", name: "Alice", avatarColor: generateAvatarColor("user2") }, { id: "user4", name: "Charlie", avatarColor: generateAvatarColor("user4") }],
    maxAttendees: 5,
    createdBy: { id: "user2", name: "Alice", avatarColor: generateAvatarColor("user2") },
  },
]

// --- Helper Functions ---

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// --- Main Component ---

export default function GroupEventPlanner() {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()) // Select today by default
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)

  // Memoize calendar generation for performance
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const rows: Date[][] = []
    let days: Date[] = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        days.push(day)
        day = addDays(day, 1)
      }
      rows.push(days)
      days = []
    }
    return rows
  }, [currentMonth])

  // Memoize events on the selected date
  const eventsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    return events
      .filter((event) => isValid(parseISO(event.date)) && isSameDay(parseISO(event.date), selectedDate))
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()) // Sort events by time
  }, [selectedDate, events])

  // Memoize events grouped by date for calendar indicators
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>()
    events.forEach((event) => {
      if (isValid(parseISO(event.date))) {
        const dateKey = format(parseISO(event.date), "yyyy-MM-dd")
        const existing = map.get(dateKey) || []
        map.set(dateKey, [...existing, event])
      }
    })
    return map
  }, [events])

  // --- Handlers ---

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
    setSelectedDate(null) // Clear selection when changing month
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
    setSelectedDate(null) // Clear selection when changing month
  }

  const handleDateClick = (day: Date) => {
    setSelectedDate(day)
  }

  const openAddEventModal = () => setIsAddEventModalOpen(true)
  const closeAddEventModal = () => setIsAddEventModalOpen(false)

  const openSettingsModal = () => setIsSettingsModalOpen(true)
  const closeSettingsModal = () => setIsSettingsModalOpen(false)

  // Function to show toast notifications
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type })
    // Automatically clear the notification after 3 seconds
    setTimeout(() => setNotification(null), 3000)
  }

  // Handler for adding a new event
  const handleAddEvent = (newEventData: Omit<Event, "id" | "attendees" | "createdBy">) => {
    const parsedDate = parseISO(newEventData.date)
    if (!isValid(parsedDate)) {
        showToast("Invalid date format provided.", "error");
        return;
    }

    const newEvent: Event = {
      ...newEventData,
      id: `evt${Date.now()}`,
      attendees: [mockUser], // Start with the creator attending
      createdBy: mockUser,
      date: parsedDate.toISOString(), // Store as ISO string
    }
    setEvents([...events, newEvent])
    setSelectedDate(parsedDate) // Select the date of the newly added event
    closeAddEventModal() // Close modal on success
    showToast(`Event "${newEvent.title}" created successfully!`, "success")
  }

  // Handler for RSVPing to an event
  const handleRsvp = (eventId: string) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => {
        if (event.id === eventId) {
          const isAttending = event.attendees.some((a) => a.id === mockUser.id)
          let newAttendees: Attendee[]

          if (isAttending) {
            // Cancel RSVP
            newAttendees = event.attendees.filter((a) => a.id !== mockUser.id)
            showToast(`Your RSVP for "${event.title}" has been canceled.`, "success")
          } else {
            // Join RSVP
            if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
              showToast(`Sorry, "${event.title}" is full.`, "error")
              return event // Return unchanged event if full
            } else {
              newAttendees = [...event.attendees, mockUser]
              showToast(`You've successfully RSVP'd to "${event.title}"!`, "success")
            }
          }
          return { ...event, attendees: newAttendees }
        }
        return event
      }),
    )
  }

  // --- Render ---

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 font-sans text-gray-800 antialiased">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 20, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`fixed top-0 left-1/2 transform -translate-x-1/2 z-[100] mt-4 flex items-center w-full max-w-xs p-4 rounded-xl shadow-lg border-l-4 ${
              notification.type === "success"
                ? "bg-green-50 border-green-500"
                : "bg-red-50 border-red-500"
            }`}
            role="alert"
          >
            {notification.type === "success" ? (
              <Bell className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
            )}
            <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {notification.message}
            </p>
             <button
                onClick={() => setNotification(null)}
                className={`ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg inline-flex h-8 w-8 ${
                    notification.type === 'success'
                        ? 'bg-green-50 text-green-500 hover:bg-green-100 focus:ring-2 focus:ring-green-400'
                        : 'bg-red-50 text-red-500 hover:bg-red-100 focus:ring-2 focus:ring-red-400'
                }`}
                aria-label="Close"
            >
                <span className="sr-only">Close</span>
                <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-lg border-b border-gray-200/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg shadow">
                <CalendarIconLucide className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-800">
                Group Planner
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={openAddEventModal}
                className="flex items-center px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow hover:shadow-md transition duration-200 ease-in-out text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                New Event
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={openSettingsModal}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => showToast("Logout functionality placeholder.", "success")}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400"
                aria-label="Logout"
              >
                <LogOut className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 lg:gap-8">

          {/* Calendar Section (Wider on Large Screens) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="lg:col-span-4 bg-white p-5 md:p-6 rounded-xl shadow-lg border border-gray-100"
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <div className="flex items-center space-x-1">
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={handlePrevMonth}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}
                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  Today
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={handleNextMonth}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-5 w-5" />
                </motion.button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-3 border-b pb-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.flat().map((day, index) => {
                const dateKey = format(day, "yyyy-MM-dd")
                const eventsOnDay = eventsByDate.get(dateKey) || []
                const eventsCount = eventsOnDay.length
                const isCurrentMonthDay = isSameMonth(day, currentMonth)
                const isToday = isSameDay(day, new Date())
                const isSelected = selectedDate && isSameDay(day, selectedDate)

                return (
                  <motion.div
                    key={index}
                    onClick={() => isCurrentMonthDay && handleDateClick(day)}
                    className={`
                      relative p-1 aspect-square flex flex-col items-center justify-start rounded-lg cursor-pointer transition-all duration-150 ease-in-out border
                      ${isCurrentMonthDay ? "border-gray-200" : "border-transparent"}
                      ${isSelected ? "bg-indigo-600 text-white font-semibold shadow-md scale-105" : ""}
                      ${!isSelected && isCurrentMonthDay ? "hover:bg-indigo-50 hover:shadow-sm" : ""}
                      ${isToday && !isSelected ? "bg-indigo-100 text-indigo-800 font-medium ring-1 ring-indigo-300" : ""}
                      ${!isCurrentMonthDay ? "text-gray-300 cursor-default" : "text-gray-700"}
                    `}
                    whileHover={isCurrentMonthDay && !isSelected ? { y: -2 } : {}}
                    whileTap={isCurrentMonthDay ? { scale: 0.95 } : {}}
                  >
                    <span className={`text-xs md:text-sm mb-0.5 ${isToday && !isSelected ? 'font-semibold' : ''} ${isSelected ? 'font-semibold' : ''}`}>
                      {format(day, "d")}
                    </span>
                    {/* Event indicators */}
                    {eventsCount > 0 && isCurrentMonthDay && (
                      <div className={`absolute bottom-1 left-1 right-1 flex justify-center items-center space-x-0.5 ${eventsCount > 2 ? 'px-1' : ''}`}>
                        {eventsCount > 2 ? (
                           <span className={`text-[10px] font-bold px-1 py-0.5 rounded-full ${isSelected ? "bg-white/30 text-white" : "bg-indigo-100 text-indigo-700"}`}>
                             {eventsCount}
                           </span>
                        ) : (
                          eventsOnDay.slice(0, 2).map((_, i) => (
                            <span
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/80" : "bg-indigo-500"}`}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Events Section (Narrower on Large Screens) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="lg:col-span-3 bg-white p-5 md:p-6 rounded-xl shadow-lg border border-gray-100"
          >
             <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-3">
                {selectedDate ? `Events on ${format(selectedDate, "EEEE, MMM d")}` : "Select a date"}
             </h3>
             {/* Event List Container */}
            <div className="h-[calc(100vh-18rem)] lg:h-[calc(100vh-15rem)] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                <AnimatePresence mode="wait">
                {selectedDate ? (
                    eventsOnSelectedDate.length > 0 ? (
                    <motion.div
                        key={format(selectedDate, "yyyy-MM-dd")} // Key ensures animation runs on date change
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                    >
                        {eventsOnSelectedDate.map((event) => (
                        <EventCard key={event.id} event={event} onRsvp={handleRsvp} currentUser={mockUser} />
                        ))}
                    </motion.div>
                    ) : (
                    // "No events" state
                    <motion.div
                        key="no-events"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="text-center py-12 px-6 bg-gray-50 rounded-lg border border-dashed border-gray-200 mt-4"
                    >
                        <CalendarIconLucide className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <p className="font-medium text-gray-600">No events scheduled for this day.</p>
                        <p className="text-sm text-gray-500 mt-1">Why not add one?</p>
                    </motion.div>
                    )
                ) : (
                    // "Select a date" state
                    <motion.div
                        key="select-date"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="text-center py-12 px-6 bg-gray-50 rounded-lg border border-dashed border-gray-200 mt-4"
                    >
                        <CalendarIconLucide className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <p className="font-medium text-gray-600">Select a date from the calendar</p>
                        <p className="text-sm text-gray-500 mt-1">Click on a day to view its events.</p>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/60 border-t border-gray-200/70 mt-auto py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Group Planner App. Built with React & Tailwind.
          </p>
          {/* Optional: Add links here if needed */}
          {/* <div className="flex justify-center space-x-4 mt-2">
             <a href="#" className="text-xs text-gray-400 hover:text-indigo-600 transition">Terms</a>
             <a href="#" className="text-xs text-gray-400 hover:text-indigo-600 transition">Privacy</a>
           </div> */}
        </div>
      </footer>

      {/* Add Event Modal */}
      <CustomModal isOpen={isAddEventModalOpen} onClose={closeAddEventModal} zIndex="z-40">
        <AddEventForm onAddEvent={handleAddEvent} onClose={closeAddEventModal} showToast={showToast} />
      </CustomModal>

      {/* Settings Modal */}
      <CustomModal isOpen={isSettingsModalOpen} onClose={closeSettingsModal} zIndex="z-50">
        <SettingsContent onClose={closeSettingsModal} />
      </CustomModal>

      {/* Custom Scrollbar CSS (Optional, but improves look of event list) */}
       <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9; /* bg-slate-100 */
            border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1; /* bg-slate-300 */
            border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8; /* bg-slate-400 */
        }
      `}</style>
    </div>
  )
}

// --- Sub Components ---

// Event Card Component
interface EventCardProps {
  event: Event
  onRsvp: (eventId: string) => void
  currentUser: Attendee
}

function EventCard({ event, onRsvp, currentUser }: EventCardProps) {
  const isAttending = event.attendees.some((a) => a.id === currentUser.id)
  const isFull = !!event.maxAttendees && event.attendees.length >= event.maxAttendees
  const canRsvp = !isAttending && isFull // User cannot RSVP if they aren't attending AND the event is full

  const eventDate = parseISO(event.date)

  return (
    <motion.div
      layout // Animate layout changes (e.g., when RSVPing)
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      {/* Event Title */}
      <h4 className="font-semibold text-base text-gray-800 mb-1.5">{event.title}</h4>

      {/* Event Time & Location */}
      <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500 space-y-1 sm:space-y-0 sm:space-x-4 mb-3">
        <div className="flex items-center">
          <Clock className="w-3.5 h-3.5 mr-1.5 text-indigo-500 flex-shrink-0" />
          <span className="font-medium">{isValid(eventDate) ? format(eventDate, "h:mm a") : "Invalid Time"}</span>
        </div>
        <div className="flex items-center">
          <MapPin className="w-3.5 h-3.5 mr-1.5 text-indigo-500 flex-shrink-0" />
          <span className="font-medium truncate" title={event.location}>{event.location}</span>
        </div>
      </div>

      {/* Event Description */}
      {event.description && (
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{event.description}</p>
      )}

      {/* Attendee Info & RSVP */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        {/* Attendees Avatars & Count */}
        <div className="flex items-center space-x-2">
            <div className="flex -space-x-2 overflow-hidden">
                {event.attendees.slice(0, 4).map((attendee) => (
                    <div
                    key={attendee.id}
                    title={attendee.name}
                    className={`inline-flex items-center justify-center h-7 w-7 rounded-full ring-2 ring-white text-white text-[10px] font-bold shadow-sm uppercase ${attendee.avatarColor || 'bg-gray-400'}`}
                    >
                    {attendee.name?.charAt(0)}
                    </div>
                ))}
                {event.attendees.length > 4 && (
                    <div className="inline-flex items-center justify-center h-7 w-7 rounded-full ring-2 ring-white bg-gray-200 text-gray-600 text-[10px] font-bold shadow-sm">
                    +{event.attendees.length - 4}
                    </div>
                )}
            </div>
            <div className="text-xs text-gray-500">
                <span className="font-medium">{event.attendees.length}</span> attending
                {event.maxAttendees && <span> / {event.maxAttendees}</span>}
                {isFull && !isAttending && (
                    <span className="ml-2 text-[10px] font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">Full</span>
                )}
            </div>
        </div>

        {/* RSVP Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onRsvp(event.id)}
          disabled={canRsvp}
          className={`
            px-3 py-1.5 rounded-md text-xs font-medium transition duration-150 ease-in-out flex items-center shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1
            ${
              isAttending
                ? "bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 focus:ring-red-400" // Cancel state
                : canRsvp
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300" // Disabled (Full) state
                  : "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 focus:ring-green-400" // RSVP state
            }
          `}
        >
          {isAttending ? <X className="w-3.5 h-3.5 mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
          {isAttending ? "Cancel RSVP" : "RSVP"}
        </motion.button>
      </div>

        {/* Creator Info (Subtle) */}
        <div className="flex items-center text-[11px] text-gray-400 mt-3 pt-2 border-t border-gray-100">
          <Info className="w-3 h-3 mr-1 flex-shrink-0" />
          Created by {event.createdBy.id === currentUser.id ? 'You' : event.createdBy.name}
        </div>
    </motion.div>
  )
}

// --- Custom Modal Component ---
interface CustomModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  zIndex?: string
}

function CustomModal({ isOpen, onClose, children, zIndex = "z-40" }: CustomModalProps) {
  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    // Cleanup function
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`relative ${zIndex}`}>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm" // Slightly darker backdrop
            onClick={onClose} // Close modal on backdrop click
            aria-hidden="true"
          />

          {/* Modal Content Wrapper */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              {/* Modal Panel */}
              <motion.div
                key="modal-panel"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
                className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all border border-gray-100"
              >
                {children}
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

// --- Add Event Form Component ---
interface AddEventFormProps {
  onClose: () => void
  onAddEvent: (newEventData: Omit<Event, "id" | "attendees" | "createdBy">) => void
  showToast: (message: string, type?: "success" | "error") => void // Pass toast function
}

function AddEventForm({ onClose, onAddEvent, showToast }: AddEventFormProps) {
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [maxAttendees, setMaxAttendees] = useState<string>("") // Store as string for input control
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Get current date/time in the required format for min attribute
  const nowDateTimeLocal = format(new Date(), "yyyy-MM-dd'T'HH:mm")

  // Form validation function
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}
    let isValidForm = true

    if (!title.trim()) {
      newErrors.title = "Title is required."
      isValidForm = false
    }
    if (!date) {
      newErrors.date = "Date and time are required."
      isValidForm = false
    } else {
        const selectedDate = parseISO(date);
        if (!isValid(selectedDate)) {
            newErrors.date = "Invalid date/time format.";
            isValidForm = false;
        } else if (isBefore(selectedDate, new Date())) {
            // Allow a small buffer (e.g., 1 minute) for near-instant events
            const oneMinuteAgo = new Date(new Date().getTime() - 60000);
            if (isBefore(selectedDate, oneMinuteAgo)) {
                newErrors.date = "Date/time cannot be in the past.";
                isValidForm = false;
            }
        }
    }
    if (!location.trim()) {
      newErrors.location = "Location is required."
      isValidForm = false
    }
    if (maxAttendees && Number.parseInt(maxAttendees, 10) <= 0) {
      newErrors.maxAttendees = "Max attendees must be a positive number."
      isValidForm = false
    }

    setErrors(newErrors)
    return isValidForm
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onAddEvent({
        title: title.trim(),
        date: date, // Pass the datetime-local string
        description: description.trim(),
        location: location.trim(),
        maxAttendees: maxAttendees ? Number.parseInt(maxAttendees, 10) : undefined,
      })
      // // Reset form is handled by parent closing the modal now
      // setTitle("");
      // setDate("");
      // setDescription("");
      // setLocation("");
      // setMaxAttendees("");
      // setErrors({});
      // onClose(); // Parent closes modal on successful add
    } else {
        // Optionally show a generic error toast if specific field errors aren't enough
        // showToast("Please fix the errors in the form.", "error");
    }
  }

  return (
    <>
      {/* Modal Header */}
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Create New Event
        </h3>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition focus:outline-none focus:ring-2 focus:ring-indigo-300"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Field */}
        <div>
          <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="event-title"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrors({...errors, title: ''}) }}
            required
            className={`w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm focus:outline-none focus:ring-2 ${errors.title ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
            placeholder="e.g., Project Kickoff Meeting"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "title-error" : undefined}
          />
          {errors.title && <p id="title-error" className="mt-1 text-xs text-red-600">{errors.title}</p>}
        </div>

        {/* Date & Time Field */}
        <div>
          <label htmlFor="event-date" className="block text-sm font-medium text-gray-700 mb-1">
            Date & Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="event-date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setErrors({...errors, date: ''}) }}
            required
            min={nowDateTimeLocal} // Prevent selecting past dates/times
            className={`w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm focus:outline-none focus:ring-2 ${errors.date ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? "date-error" : undefined}
          />
          {errors.date && <p id="date-error" className="mt-1 text-xs text-red-600">{errors.date}</p>}
        </div>

        {/* Location Field */}
        <div>
          <label htmlFor="event-location" className="block text-sm font-medium text-gray-700 mb-1">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="event-location"
            value={location}
            onChange={(e) => { setLocation(e.target.value); setErrors({...errors, location: ''}) }}
            required
            className={`w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm focus:outline-none focus:ring-2 ${errors.location ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
            placeholder="e.g., Main Conference Room or Online"
            aria-invalid={!!errors.location}
            aria-describedby={errors.location ? "location-error" : undefined}
          />
           {errors.location && <p id="location-error" className="mt-1 text-xs text-red-600">{errors.location}</p>}
        </div>

        {/* Description Field */}
        <div>
          <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="event-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-none"
            placeholder="Add any relevant details, agenda, or links..."
          />
        </div>

        {/* Max Attendees Field */}
        <div>
          <label htmlFor="event-max-attendees" className="block text-sm font-medium text-gray-700 mb-1">
            Max Attendees (Optional)
          </label>
          <input
            type="number"
            id="event-max-attendees"
            value={maxAttendees}
            onChange={(e) => { setMaxAttendees(e.target.value); setErrors({...errors, maxAttendees: ''}) }}
            min="1"
            className={`w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm focus:outline-none focus:ring-2 ${errors.maxAttendees ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
            placeholder="Leave blank for unlimited"
            aria-invalid={!!errors.maxAttendees}
            aria-describedby={errors.maxAttendees ? "max-attendees-error" : undefined}
          />
          {errors.maxAttendees && <p id="max-attendees-error" className="mt-1 text-xs text-red-600">{errors.maxAttendees}</p>}
        </div>

        {/* Form Actions */}
        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <motion.button
            type="button" // Important: type="button" to prevent form submission
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 transition"
            onClick={onClose}
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 border border-transparent rounded-md shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition"
          >
            Create Event
          </motion.button>
        </div>
      </form>
    </>
  )
}

// --- Settings Content Component ---
interface SettingsContentProps {
  onClose: () => void
}

function SettingsContent({ onClose }: SettingsContentProps) {
  // In a real app, these would likely come from state/context
  const [settings, setSettings] = useState({
    emailReminders: true,
    pushNotifications: true,
    smsAlerts: false,
    darkMode: false, // Example, actual implementation needed
    showWeekends: true,
  });

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleSaveChanges = () => {
    // Logic to save settings (e.g., API call, local storage)
    console.log("Saving settings:", settings);
    // Show a success toast (assuming showToast is passed or available via context)
    // showToast("Settings saved successfully!", "success");
    onClose(); // Close modal after saving
  };

  return (
    <>
      {/* Modal Header */}
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Application Settings
        </h3>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition focus:outline-none focus:ring-2 focus:ring-indigo-300"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Notification Preferences */}
        <div className="p-4 rounded-lg border border-gray-200 bg-gray-50/50">
          <h4 className="font-medium text-gray-800 mb-3 text-sm">Notification Preferences</h4>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="emailReminders"
                checked={settings.emailReminders}
                onChange={handleCheckboxChange}
                className="rounded h-4 w-4 border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50"
              />
              <span className="text-sm text-gray-700">Email Reminders</span>
            </label>
             <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="pushNotifications"
                checked={settings.pushNotifications}
                onChange={handleCheckboxChange}
                className="rounded h-4 w-4 border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50"
              />
              <span className="text-sm text-gray-700">In-App Notifications</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="smsAlerts"
                checked={settings.smsAlerts}
                onChange={handleCheckboxChange}
                className="rounded h-4 w-4 border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50"
                disabled // Example: Feature not available
              />
              <span className="text-sm text-gray-500">SMS Alerts (Coming Soon)</span>
            </label>
          </div>
        </div>

        {/* Display Settings */}
        <div className="p-4 rounded-lg border border-gray-200 bg-gray-50/50">
          <h4 className="font-medium text-gray-800 mb-3 text-sm">Display Settings</h4>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="darkMode"
                checked={settings.darkMode}
                onChange={handleCheckboxChange}
                className="rounded h-4 w-4 border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50"
                disabled // Example: Dark mode not implemented yet
              />
              <span className="text-sm text-gray-500">Dark Mode (Experimental)</span>
            </label>
             <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="showWeekends"
                checked={settings.showWeekends}
                onChange={handleCheckboxChange}
                className="rounded h-4 w-4 border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50"
                disabled // Example: Calendar always shows weekends currently
              />
              <span className="text-sm text-gray-500">Show Weekends in Calendar</span>
            </label>
          </div>
        </div>
      </div>

      {/* Modal Actions */}
      <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
         <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 transition"
            onClick={onClose} // Just close without saving
          >
            Cancel
          </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 border border-transparent rounded-md shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition"
          onClick={handleSaveChanges}
        >
          Save Changes
        </motion.button>
      </div>
    </>
  )
}
