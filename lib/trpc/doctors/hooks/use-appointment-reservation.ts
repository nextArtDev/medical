import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTRPC } from '@/trpc/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface HookProps {
  userId?: string
  onConflict: () => void
}

interface ReservationPayload {
  doctorId: string
  date: string
  startTime: string
  endTime: string
}

export const useAppointmentReservation = ({
  userId,
  onConflict,
}: HookProps) => {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const mutation = useMutation(
    trpc.doctors.reserveAppointment.mutationOptions({
      onSuccess: (data: any, variables) => {
        if (data.success && data.data) {
          toast.success(data.message || 'Slot reserved successfully!')

          // Invalidate all getAvailableSlots queries to refresh the UI
          queryClient.invalidateQueries({
            queryKey: ['doctors', 'getAvailableSlots'],
          })

          // Also invalidate pending appointment query
          queryClient.invalidateQueries({
            queryKey: ['doctors', 'getPendingAppointment'],
          })

          // Construct the redirection URL
          const params = new URLSearchParams({
            appointmentId: data.data.appointmentId,
          })

          // For guest users, append the guestIdentifier to the URL
          if ('guestIdentifier' in data.data) {
            // @ts-ignore - Validated by runtime check but TS might not infer from union
            params.append('guestIdentifier', data.data.guestIdentifier)
          }

          // Navigate to the patient details page
          router.push(`/appointments/patient-details?${params.toString()}`)
        } else {
          // Handle failure
          toast.error(data.error || 'An unknown error occurred.')

          // If the error is a slot conflict, invoke the callback
          if (data.errorType === 'SLOT_UNAVAILABLE') {
            onConflict()
          }
        }
      },
      onError: (error) => {
        toast.error('An unexpected error occured. Please try again later')
      },
    })
  )

  // Exposed function to trigger the reservation.
  const mutate = (payload: ReservationPayload) => {
    mutation.mutate({
      ...payload,
      userId, // Optional, handled by tRPC input schema
    })
  }

  return {
    mutate,
    isPending: mutation.isPending,
  }
}
