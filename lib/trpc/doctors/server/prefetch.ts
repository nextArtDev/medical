import type { inferInput } from '@trpc/tanstack-react-query'
import { prefetch, trpc } from '@/trpc/server'

type Input = inferInput<typeof trpc.doctors.getInfiniteMany>

/**
 * Prefetch all products
 */
export const prefetchDoctors = (input: Input) => {
  return prefetch(trpc.doctors.getInfiniteMany.queryOptions(input))
}
