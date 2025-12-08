import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { useDoctorsParams } from './use-doctors-params'

/**
 * Hook to fetch available filter options with counts
 * Automatically updates when other filters change
 */
export const useFilterOptions = () => {
  const trpc = useTRPC()
  const [params] = useDoctorsParams()

  return useQuery(
    trpc.doctorsRouter.getFilterOptions.queryOptions({
      search: params.search || undefined,
      specialty: params.specialty || undefined,
    })
  )
}
