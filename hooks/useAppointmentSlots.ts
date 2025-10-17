import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns-tz'
import { toast } from 'sonner'
import {
  getAvailableDoctorSlots,
  getPendingAppointmentForDoctor,
} from '@/lib/queries/server-home'

export const useAppointmentSlots = (doctorId: string, userId?: string) => {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [initialTimeSlot, setInitialTimeSlot] = useState<string | null>(null)

  // Query for pending appointment (runs once on mount if userId exists)
  const { data: pendingAppointment } = useQuery({
    queryKey: ['pending-appointment', userId, doctorId],
    queryFn: async () => {
      if (!userId) return null

      const response = await getPendingAppointmentForDoctor({
        userId,
        doctorId,
      })

      if (response.success && response.data?.appointment) {
        return response.data.appointment
      }
      return null
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Query for available time slots
  const {
    data: timeSlots = [],
    isLoading,
    refetch: fetchSlotsForDate,
  } = useQuery({
    queryKey: [
      'appointment-slots',
      doctorId,
      date ? format(date, 'yyyy-MM-dd') : null,
      userId,
    ],
    queryFn: async () => {
      if (!date) return []

      const dateString = format(date, 'yyyy-MM-dd')
      const response = await getAvailableDoctorSlots({
        doctorId,
        date: dateString,
        currentUserId: userId,
      })

      if (response.success && response.data) {
        return response.data
      } else {
        toast.error(response.message || 'Could not load appointment slots.')
        return []
      }
    },
    enabled: !!date && !!doctorId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  // Effect to initialize date and slot from pending appointment
  useEffect(() => {
    if (pendingAppointment) {
      const { date: pendingDate, startTime } = pendingAppointment
      setDate(new Date(pendingDate))
      setInitialTimeSlot(startTime)
    }
  }, [pendingAppointment])

  return {
    date,
    setDate,
    timeSlots,
    initialTimeSlot,
    isLoading,
    fetchSlotsForDate,
  }
}
