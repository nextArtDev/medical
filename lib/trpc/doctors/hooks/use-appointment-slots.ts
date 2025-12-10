import { useState, useEffect } from 'react'
import { format } from 'date-fns-tz'
import { toast } from 'sonner'
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

  // --- Query 2: Fetch Available Slots for the Selected Date ---
  const {
    data: timeSlotsResponse,
    isLoading: isSlotsLoading,
    isError: isSlotsError,
    error: slotsError,
    refetch: fetchSlotsForDate,
  } = useQuery(
    trpc.doctors.getAvailableSlots.queryOptions(
      {
        doctorId,
        date: format(date, 'yyyy-MM-dd'),
        userId,
      },
      {
        enabled: !!date && !!doctorId,
        staleTime: 1000 * 60 * 2,
      }
    )
  )

  const timeSlots: TimeSlot[] =
    timeSlotsResponse?.success && timeSlotsResponse.data
      ? timeSlotsResponse.data
      : []

  // Handle errors via toast (optional, might be better to handle in UI)
  useEffect(() => {
    if (timeSlotsResponse?.success === false) {
      toast.error(
        timeSlotsResponse.message || 'Could not load appointment slots.'
      )
    }
  }, [timeSlotsResponse])

  // --- Effect to Initialize State from Pending Appointment ---
  useEffect(() => {
    if (pendingAppointmentData) {
      const { date: pendingDate, startTime } = pendingAppointmentData
      // Ensure we parse the date string correctly to a Date object
      setDate(new Date(pendingDate))
      setInitialTimeSlot(startTime)
    }
  }, [pendingAppointmentData])

  const isLoading = isPendingLoading || isSlotsLoading

  return {
    date,
    setDate,
    timeSlots,
    initialTimeSlot,
    isLoading,
    isError: isSlotsError,
    error: slotsError,
    fetchSlotsForDate,
  }
}
