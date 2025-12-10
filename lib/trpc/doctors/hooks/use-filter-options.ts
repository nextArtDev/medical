import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { useDoctorsInfiniteParams } from './use-doctors-params'

/**
 * Hook to fetch available filter options with counts
 * Automatically updates when other filters change
 */
export const useDoctorFilterOptions = () => {
  const trpc = useTRPC()
  const [params] = useDoctorsInfiniteParams()

  return useQuery(
    trpc.doctors.getFilterOptions.queryOptions({
      search: params.search || undefined,
      specialty: params.specialty || undefined,
    })
  )
}
