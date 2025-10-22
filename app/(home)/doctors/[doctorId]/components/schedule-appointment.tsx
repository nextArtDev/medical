'use client'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { useAppointmentSlots } from '@/hooks/useAppointmentSlots'
import { useState, useEffect } from 'react'
import {
  startOfMonth,
  addMonths,
  startOfDay,
  isAfter,
  format,
} from 'date-fns-jalali'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TimeSlot } from '@/types/home'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppointmentReservation } from '@/hooks/useAppointmentReservation'

interface AppointmentSchedulerProps {
  doctorId: string
  userId?: string
  userRole?: string
}

export default function AppointmentScheduler({
  doctorId,
  userId,
  userRole,
}: AppointmentSchedulerProps) {
  const {
    date: selectedDate,
    setDate,
    timeSlots,
    initialTimeSlot,
    isLoading,
    fetchSlotsForDate,
  } = useAppointmentSlots(doctorId, userId)

  const { mutate: reserveApointment, isPending } = useAppointmentReservation({
    userId,
    onConflict: () => {
      setSelectedSlot(null)
      if (selectedDate) fetchSlotsForDate()
    },
  })

  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [outOfRangeMessage, setOutOfRangeMessage] = useState<string | null>(
    null
  )

  // Sync selected slot with initial pending appointment
  useEffect(() => {
    if (initialTimeSlot && timeSlots.length > 0) {
      const slotToSelect = timeSlots.find(
        (slot) => slot.startTime === initialTimeSlot
      )
      setSelectedSlot(slotToSelect || null)
    }
  }, [initialTimeSlot, timeSlots])

  // Sync calendar month with selected date, but only when a date is explicitly selected
  useEffect(() => {
    if (selectedDate && !currentMonth) {
      // Only set currentMonth if it's not already set
      setCurrentMonth(selectedDate)
    }
  }, [selectedDate])

  const handleReservation = () => {
    if (!selectedDate || !selectedSlot) {
      console.error('A date and time slot must be selected.')
      return
    }
    // Add your reservation logic here

    reserveApointment({
      doctorId,
      date: format(selectedDate, 'yyyy-MM-dd'), // Format date to YYYY-MM-DD
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
    })
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setDate(date)
      setSelectedSlot(null)
      fetchSlotsForDate()
      // Update the current month when a date is selected
      setCurrentMonth(date)
    }
  }

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month)
    const toDate = addMonths(new Date(), 2)

    if (isAfter(startOfMonth(month), toDate)) {
      setDate(new Date())
      setSelectedSlot(null)
      setOutOfRangeMessage('This is too far in the future')
    } else {
      setOutOfRangeMessage(null)
      // Don't automatically select a date when changing months
      // Let the user explicitly select a date
    }
  }

  const today = new Date()
  const toDate = addMonths(today, 2)

  const getButtonText = () => {
    if (userRole === 'ADMIN') return 'Admins cannot Book'
    return 'Continue to Next Step'
  }

  return (
    <div className="bg-background p-6 rounded-lg shadow-small max-w-md mx-auto md:flex-1">
      <h3 className="text-text-title mb-3">Schedule Appointment</h3>
      <div className="flex justify-center">
        <Calendar
          mode="single"
          animate
          dir="rtl"
          selected={selectedDate}
          onSelect={handleDateSelect}
          month={currentMonth}
          onMonthChange={handleMonthChange}
          disabled={(date) =>
            date < new Date(new Date().setDate(new Date().getDate() - 1)) ||
            date.getDay() === 5 ||
            date > toDate
          }
          className="rounded-md border border-border"
          classNames={{ day: 'focus-visible:ring-0' }}
        />
      </div>

      <div className="mt-[20px]">
        <div className="body-semibold text-text-title mb-3">
          Available Time Slots
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8">
            {/* <Loader2 className="animate-spin h-8 w-8 text-primary" /> */}
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 16 }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-full  rounded-md',
                    'flex items-center justify-center'
                  )}
                >
                  <Skeleton className="w-24 h-8 bg-gray-300 dark:bg-gray-700 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ) : outOfRangeMessage ? (
          <div className="text-center text-grey-500 rounded-md p-4 bg-gray-50">
            {outOfRangeMessage}
          </div>
        ) : timeSlots.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {timeSlots.map((slot) => (
              <Button
                key={slot.startTime}
                variant={
                  selectedSlot?.startTime === slot.startTime
                    ? 'default'
                    : 'outline'
                }
                onClick={() => setSelectedSlot(slot)}
                className={cn(
                  'w-full py-2 px-4 border border-border-2 body-small-bold',
                  {
                    'text-text-caption-2':
                      selectedSlot?.startTime === slot.startTime,
                    'text-text-body':
                      selectedSlot?.startTime !== slot.startTime,
                  }
                )}
              >
                {slot.startTime}
              </Button>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 bg-gray-50 p-4 rounded-md">
            No available slots for this day.
          </div>
        )}
      </div>

      <div className="mt-6">
        <Button
          onClick={handleReservation}
          disabled={
            !selectedSlot || isLoading || isPending || userRole === 'ADMIN'
          }
          className="w-full py-6 body-semibold text-text-caption-2 mb-20"
        >
          {getButtonText()}
        </Button>
      </div>
    </div>
  )
}
