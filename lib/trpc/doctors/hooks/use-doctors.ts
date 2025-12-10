import { useTRPC } from '@/trpc/client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { useDoctorsParams } from './use-doctors-params'

export const useSuspenseProducts = () => {
  const trpc = useTRPC()
  const [params] = useDoctorsParams()

  return useSuspenseQuery(trpc.doctors.getInfiniteMany.queryOptions(params))
}
