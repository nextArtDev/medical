'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TimeSlot } from '@/types/home'
import { useTRPC } from '@/trpc/client'
import { useSuspenseQuery } from '@tanstack/react-query'
import { format } from 'date-fns-tz'
import { useEffect } from 'react'
import { toast } from 'sonner'

interface TimeSlotsListProps {
  doctorId: string
  userId?: string
  date: Date
  selectedSlot: TimeSlot | null
  onSelectSlot: (slot: TimeSlot) => void
}

export default function TimeSlotsList({
  doctorId,
  userId,
  date,
  selectedSlot,
  onSelectSlot,
}: TimeSlotsListProps) {
  const trpc = useTRPC()

  const { data: timeSlotsResponse } = useSuspenseQuery(
    trpc.doctors.getAvailableSlots.queryOptions(
      {
        doctorId,
        date: format(date, 'yyyy-MM-dd'),
        userId,
      },
      {
        staleTime: 1000 * 60 * 2,
      }
    )
  )

  const timeSlots: TimeSlot[] =
    timeSlotsResponse?.success && timeSlotsResponse.data
      ? timeSlotsResponse.data.map((slot: any) => ({
          ...slot,
          startTimeUTC: new Date(slot.startTimeUTC),
          endTimeUTC: new Date(slot.endTimeUTC),
        }))
      : []

  useEffect(() => {
    if (timeSlotsResponse?.success === false) {
      toast.error(
        timeSlotsResponse.message || 'Could not load appointment slots.'
      )
    }
  }, [timeSlotsResponse])

  if (timeSlots.length === 0) {
    return (
      <div className="text-center text-gray-500 bg-gray-50 p-4 rounded-md">
        No available slots for this day.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {timeSlots.map((slot) => {
        const isAvailable = slot.isAvailable
        const isSelected = selectedSlot?.startTime === slot.startTime

        return (
          <Button
            key={slot.startTime}
            variant={isSelected ? 'default' : 'outline'}
            onClick={() => isAvailable && onSelectSlot(slot)}
            disabled={!isAvailable}
            className={cn(
              'w-full py-2 px-4 border border-border-2 body-small-bold',
              {
                'text-text-caption-2': isSelected,
                'text-text-body': !isSelected && isAvailable,
                'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400':
                  !isAvailable,
              }
            )}
          >
            {slot.startTime}
          </Button>
        )
      })}
    </div>
  )
}
