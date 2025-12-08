import type { inferInput } from '@trpc/tanstack-react-query'
import { prefetch, trpc } from '@/trpc/server'

type Input = inferInput<typeof trpc.products.getMany>

/**
 * Prefetch all products
 */
export const prefetchProducts = (input: Input) => {
  return prefetch(trpc.products.getMany.queryOptions(input))
}
