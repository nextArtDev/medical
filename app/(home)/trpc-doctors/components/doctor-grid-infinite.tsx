'use client'

import { useTRPC } from '@/trpc/client'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useDoctorsInfiniteParams } from '@/lib/trpc/doctors/hooks/use-doctors-params'
import DoctorGrid from './doctor-grid'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export const DoctorGridInfinite = () => {
  const trpc = useTRPC()
  const [params] = useDoctorsInfiniteParams()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery(
    trpc.doctorsRouter.getInfiniteMany.infiniteQueryOptions(
      {
        limit: params.limit,
        search: params.search || undefined,
        specialty: params.specialty.length > 0 ? params.specialty : undefined,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    )
  )

  // Flatten all pages into a single array
  const doctors = data?.pages.flatMap((page) => page.items) ?? []

  if (isLoading) {
    return <DoctorGrid doctors={[]} loading={true} />
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-500">
        خطا در بارگذاری اطلاعات
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <DoctorGrid doctors={doctors} />

      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="outline"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                در حال بارگذاری...
              </>
            ) : (
              'بارگذاری بیشتر'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
