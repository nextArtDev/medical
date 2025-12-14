import { useState, useEffect } from 'react'
import { TimeSlot } from '@/types/home'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'

export const useAppointmentSlots = (doctorId: string, userId?: string) => {
  const trpc = useTRPC()
  // --- State Management ---
  const [date, setDate] = useState<Date>(new Date())
  const [initialTimeSlot, setInitialTimeSlot] = useState<string | null>(null)

  // --- Query 1: Check for a Pending Appointment ---
  const { data: pendingAppointmentData, isLoading: isPendingLoading } =
    useQuery(
      trpc.doctors.getPendingAppointment.queryOptions(
        { doctorId, userId: userId ?? '' },
        {
          enabled: !!userId && !!doctorId,
          staleTime: 1000 * 60 * 5,
          select: (data) => data.data?.appointment, // Extract appointment from response
        }
      )
    )

  // --- Effect to Initialize State from Pending Appointment ---
  useEffect(() => {
    if (pendingAppointmentData) {
      const { date: pendingDate, startTime } = pendingAppointmentData
      // Ensure we parse the date string correctly to a Date object
      setDate(new Date(pendingDate))
      setInitialTimeSlot(startTime)
    }
  }, [pendingAppointmentData])

  return {
    date,
    setDate,
    initialTimeSlot,
    isPendingLoading,
  }
}
