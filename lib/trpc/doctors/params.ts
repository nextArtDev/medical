import { PAGINATION } from '@/constant/pagination'
import { parseAsArrayOf, parseAsInteger, parseAsString } from 'nuqs/server'

export const doctorsParams = {
  page: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  pageSize: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),
  search: parseAsString.withDefault('').withOptions({ clearOnDefault: true }),
  specialty: parseAsArrayOf(parseAsString)
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
}

export const doctorsInfiniteParams = {
  // No page parameter for infinite scroll
  limit: parseAsInteger
    .withDefault(20) // Items per load
    .withOptions({ clearOnDefault: true }),

  search: parseAsString.withDefault('').withOptions({ clearOnDefault: true }),

  specialty: parseAsArrayOf(parseAsString)
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
  sortBy: parseAsString
    .withDefault('newest')
    .withOptions({ clearOnDefault: true }),
}

export type DoctorsInfiniteParams = typeof doctorsInfiniteParams
