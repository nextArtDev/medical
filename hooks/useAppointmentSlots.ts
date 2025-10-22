import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns-tz'
import { toast } from 'sonner'
import {
  getAvailableDoctorSlots,
  getPendingAppointmentForDoctor,
} from '@/lib/queries/server-home'
import { TimeSlot } from '@/types/home'
// Assuming you have a TimeSlot type

// Define a type for the appointment object for better type safety.
type PendingAppointment = {
  date: string
  startTime: string
  // ... other appointment properties
}

export const useAppointmentSlots = (doctorId: string, userId?: string) => {
  // --- State Management ---
  // The `date` is UI state, managed by the component (e.g., a date picker).
  const [date, setDate] = useState<Date>(new Date())
  // This state holds the time slot of a pending appointment, if one exists.
  const [initialTimeSlot, setInitialTimeSlot] = useState<string | null>(null)

  // --- Query 1: Check for a Pending Appointment ---
  // This query runs once on mount (if `userId` is provided) to see if the user
  // already has a pending appointment with this doctor. This determines the initial view.
  const { data: pendingAppointment, isLoading: isPendingLoading } =
    useQuery<PendingAppointment | null>({
      queryKey: ['pending-appointment', userId, doctorId],
      queryFn: async () => {
        // If no userId, we can't check for an appointment.
        if (!userId) return null

        const response = await getPendingAppointmentForDoctor({
          userId,
          doctorId,
        })

        // If the response is successful and contains appointment data, return it.
        // Otherwise, return null. This keeps the data clean for the consumer.
        if (response.success && response.data?.appointment) {
          return response.data.appointment
        }
        return null
      },
      enabled: !!userId && !!doctorId, // Only run if we have both a user and a doctor.
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes. A pending appointment status doesn't change frequently.
    })

  // --- Query 2: Fetch Available Slots for the Selected Date ---
  // This query automatically re-runs whenever the `date` state changes, thanks to its `queryKey`.
  const {
    data: timeSlots = [],
    isLoading: isSlotsLoading,
    isError: isSlotsError,
    error: slotsError,
    refetch: fetchSlotsForDate,
  } = useQuery<TimeSlot[]>({
    queryKey: [
      'appointment-slots',
      doctorId,
      format(date, 'yyyy-MM-dd'), // The query key depends on the formatted date.
      userId,
    ],
    queryFn: async () => {
      // The `enabled` flag ensures `date` is not null/undefined before this runs.
      const dateString = format(date, 'yyyy-MM-dd')
      const response = await getAvailableDoctorSlots({
        doctorId,
        date: dateString,
        currentUserId: userId,
      })

      // On success, return the slots. On failure, show an error and return an empty array.
      // This prevents the UI from breaking and keeps the user informed.
      if (response.success && response.data) {
        return response.data
      } else {
        // Using a toast for user feedback is a good pattern.
        toast.error(response.message || 'Could not load appointment slots.')
        return [] // Return an empty array to avoid errors in components that map over `timeSlots`.
      }
    },
    enabled: !!date && !!doctorId, // Crucial: only run when a date and doctorId are available.
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes. Slot availability can change.
  })

  // --- Effect to Initialize State from Pending Appointment ---
  // This effect runs when the `pendingAppointment` query returns data.
  useEffect(() => {
    if (pendingAppointment) {
      const { date: pendingDate, startTime } = pendingAppointment
      // Set the calendar to the date of the pending appointment.
      setDate(new Date(pendingDate))
      // Set the initial slot to be highlighted in the UI.
      setInitialTimeSlot(startTime)
    }
  }, [pendingAppointment]) // Dependency array ensures this runs only when the data arrives.

  // --- Combine Loading States ---
  // We want to show a loading indicator while we're checking for a pending appointment
  // AND while we're fetching the first set of slots. After the initial load,
  // `isPendingLoading` will be false, and only `isSlotsLoading` will be true when changing dates.
  const isLoading = isPendingLoading || isSlotsLoading

  // --- Return Values ---
  // The interface remains clean and easy to use in components.
  return {
    date,
    setDate,
    timeSlots,
    initialTimeSlot,
    isLoading,
    isError: isSlotsError, // Expose error state from the slots query
    error: slotsError, // Expose the error object itself
    fetchSlotsForDate, // Alias for the refetch function, for clarity.
  }
}
