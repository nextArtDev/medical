'use client'
import { useState } from 'react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import ReviewList from './review-list'
import { usePaginatedReviews } from '@/hooks/use-paginated-reviews'
import RatingStars from '@/components/shared/star-rating'
import PaginationControls from '@/components/shared/pagination-controls'

interface PatientReviewsProps {
  doctorId: string
  averageRating: number
}

export default function PatientReviews({
  doctorId,
  averageRating,
}: PatientReviewsProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading, error } = usePaginatedReviews(
    doctorId,
    currentPage,
    10
  )

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-center py-4">Loading reviews...</p>
    }

    if (error) {
      return (
        <p className="text-center py-4 text-red-500">
          Error:{' '}
          {error instanceof Error ? error.message : 'Failed to load reviews'}
        </p>
      )
    }

    if (!data || data.reviews.length === 0) {
      return <p className="text-center py-4">No reviews found.</p>
    }

    return (
      <ReviewList
        reviews={data.reviews}
        currentPage={currentPage}
        totalReviews={totalReviews}
        reviewsPerPage={5}
      />
    )
  }

  const totalReviews = data?.totalReviews ?? 0
  const totalPages = data?.totalPages ?? 0
  const hasReviews = data && data.reviews.length > 0

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
      </CardHeader>

      {/* Card Content */}
      <CardContent>{renderContent()}</CardContent>

      {/* Card Footer */}
      {!isLoading && !error && hasReviews && totalPages > 1 && (
        <CardFooter className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardFooter>
      )}
    </Card>
  )
}
