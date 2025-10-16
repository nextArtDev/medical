'use client'
import { useEffect, useRef, useState } from 'react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import ReviewList from './review-list'
import RatingStars from '@/components/shared/star-rating'
import PaginationControls from '@/components/shared/pagination-controls'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getDoctorReviewsPaginated } from '@/lib/queries/server-home'
import { Loader, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, useInView } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
interface PatientReviewsProps {
  doctorId: string
  averageRating: number
}

export default function PatientReviews({
  doctorId,
  averageRating,
}: PatientReviewsProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['doctor-reviews-infinite', doctorId, 10],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getDoctorReviewsPaginated(doctorId, pageParam, 10)

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch reviews.')
      }

      return response.data
    },
    getNextPageParam: (lastPage) => {
      // Return next page number if there are more pages, otherwise undefined
      if (lastPage.currentPage < lastPage.totalPages) {
        return lastPage.currentPage + 1
      }
      return undefined
    },
    initialPageParam: 1,
    enabled: !!doctorId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
  // Ref for the load more trigger
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(loadMoreRef, {
    margin: '100px', // Trigger 100px before the element comes into view
  })
  // Set up intersection observer for auto-loading when scrolling into view
  // Trigger fetchNextPage when the element comes into view
  useEffect(() => {
    if (isInView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [isInView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const allReviews = data?.pages.flatMap((page) => page.reviews) ?? []
  const totalReviews = data?.pages[0]?.totalReviews ?? 0
  const totalPages = data?.pages[0]?.totalPages ?? 0
  const currentLoadedPages = data?.pages.length ?? 0

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading reviews...</span>
        </div>
      )
    }

    if (error) {
      return (
        <p className="text-center py-4 text-red-500">
          Error:{' '}
          {error instanceof Error ? error.message : 'Failed to load reviews'}
        </p>
      )
    }

    if (allReviews.length === 0) {
      return <p className="text-center py-4">No reviews found.</p>
    }

    return (
      <ScrollArea className="min-h-fit max-h-[70vh] pr-4">
        <ReviewList
          reviews={allReviews}
          currentPage={currentPage}
          totalReviews={totalReviews}
          reviewsPerPage={10}
        />

        {/* Load More Trigger with Framer Motion */}
        {hasNextPage && (
          <motion.div
            ref={loadMoreRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center py-6"
          >
            {isFetchingNextPage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center"
              >
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading more reviews...
                </span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* End of Reviews Message */}
        {!hasNextPage && allReviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-6"
          >
            <p className="text-sm text-muted-foreground">
              You've reached the end of reviews
            </p>
          </motion.div>
        )}
      </ScrollArea>
    )
  }

  return (
    <Card>
      {/* Card Header */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Patient Reviews</CardTitle>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>

          <div className="flex flex-col">
            <RatingStars rating={averageRating} />
            <p className="text-sm text-muted-foreground">
              {totalReviews} reviews
            </p>
          </div>
        </div>

        {/* Show loading progress */}
        {allReviews.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground mt-2"
          >
            Showing {allReviews.length} of {totalReviews} reviews
            {totalPages > 1 && ` (Page ${currentLoadedPages} of ${totalPages})`}
          </motion.p>
        )}
      </CardHeader>

      {/* Card Content with ScrollArea */}
      <CardContent className="p-0">
        <div className="px-6 pb-6">{renderContent()}</div>
      </CardContent>
    </Card>
  )
}
