'use client'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { useAppointmentSlots } from '@/lib/trpc/doctors/hooks/use-appointment-slots'
import { useState, useEffect, Suspense } from 'react'
import { startOfMonth, addMonths, isAfter, format } from 'date-fns-jalali'
import { TimeSlot } from '@/types/home'
import { useAppointmentReservation } from '@/lib/trpc/doctors/hooks/use-appointment-reservation'
import TimeSlotsList from './time-slots-list'
import { useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/trpc/client'

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
    initialTimeSlot,
    isPendingLoading,
  } = useAppointmentSlots(doctorId, userId)

  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  const { mutate: reserveAppointment, isPending } = useAppointmentReservation({
    userId,
    onConflict: () => {
      setSelectedSlot(null)
      // Invalidate query to refresh slots
      if (selectedDate) {
        queryClient.invalidateQueries(
          trpc.doctors.getAvailableSlots.queryOptions({
            doctorId,
            date: format(selectedDate, 'yyyy-MM-dd'),
            userId,
          }).queryKey
        )
      }
    },
  })

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [outOfRangeMessage, setOutOfRangeMessage] = useState<string | null>(
    null
  )

  // Sync calendar month with selected date, but only when a date is explicitly selected
  useEffect(() => {
    if (selectedDate && !currentMonth) {
      setCurrentMonth(selectedDate)
    }
  }, [selectedDate])

  const handleReservation = () => {
    if (!selectedDate || !selectedSlot) {
      console.error('A date and time slot must be selected.')
      return
    }

    reserveAppointment({
      doctorId,
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
    })
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setDate(date)
      setSelectedSlot(null)
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
      setDate(new Date())
    } else {
      setOutOfRangeMessage(null)
      setSelectedSlot(null)
    }
  }

  const today = new Date()
  const toDate = addMonths(today, 2)

  const getButtonText = () => {
    if (userRole === 'admin') return 'Admins cannot Book'
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

      <div className="mt-[20px] min-h-[200px]">
        <div className="body-semibold text-text-title mb-3">
          Available Time Slots
        </div>
        {outOfRangeMessage ? (
          <div className="text-center text-grey-500 rounded-md p-4 bg-gray-50">
            {outOfRangeMessage}
          </div>
        ) : (
          <Suspense fallback={<SlotsSkeleton />}>
            <TimeSlotsList
              doctorId={doctorId}
              userId={userId}
              date={selectedDate}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
            />
          </Suspense>
        )}
      </div>

      <div className="mt-6">
        <Button
          onClick={handleReservation}
          disabled={!selectedSlot || isPending || userRole === 'admin'}
          className="w-full py-6 body-semibold text-text-caption-2 mb-20"
        >
          {getButtonText()}
        </Button>
      </div>
    </div>
  )
}

function SlotsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="w-full h-10 bg-gray-100 rounded-md animate-pulse"
        />
      ))}
    </div>
  )
}
