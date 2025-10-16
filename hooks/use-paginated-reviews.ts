// import { PAGE_SIZE } from '@/lib/constants'
import { useState, useEffect, useCallback } from 'react'
// import { DoctorReview } from '@/types'
// import { getDoctorReviewsPaginated } from '@/lib/actions/review.actions'
import { DoctorReview } from '@/types/home'
import { getDoctorReviewsPaginated } from '@/lib/queries/home'
import { useQuery } from '@tanstack/react-query'

// export const usePaginatedReviews = (
//   doctorId: string,
//   initialPage = 1,
//   // reviewsPerPage = PAGE_SIZE
//   reviewsPerPage = 10
// ) => {
//   // --- State Management ---
//   const [reviews, setReviews] = useState<DoctorReview[]>([])
//   const [currentPage, setCurrentPage] = useState(initialPage)
//   const [totalPages, setTotalPages] = useState(0)
//   const [totalReviews, setTotalReviews] = useState(0)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   // --- Data Fetching Effect ---
//   useEffect(() => {
//     let isMounted = true

//     const fetchReviews = async () => {
//       setLoading(true)
//       setError(null)

//       try {
//         const response = await getDoctorReviewsPaginated(
//           doctorId,
//           currentPage,
//           reviewsPerPage
//         )
//         //only update state if the component is still mounted
//         if (isMounted) {
//           if (response.success && response.data) {
//             // Update state with fetched data
//             setReviews(response.data.reviews)
//             setTotalReviews(response.data.totalReviews)
//             setTotalPages(response.data.totalPages)
//             // Sync currentPage with the server's response
//             setCurrentPage(response.data.currentPage)
//           } else {
//             // Set error message from server action response
//             setError(response.message || 'Failed to fetch reviews.')
//           }
//         }
//       } catch (err) {
//         // Catch any unexpected errors during the fetch
//         if (isMounted) {
//           setError('An unexpected error occurred.')
//         }
//         console.error(err)
//       } finally {
//         // Ensure loading is set to false after the fetch attempt
//         if (isMounted) {
//           setLoading(false)
//         }
//       }
//     }

//     if (doctorId) {
//       fetchReviews()
//     } else {
//       if (isMounted) {
//         setLoading(false)
//       } // If no doctorId, don't attempt to load
//     }

//     // Cleanup function runs when the component unmounts or dependencies change
//     return () => {
//       //abortController.abort();
//       isMounted = false
//     }
//   }, [doctorId, currentPage, reviewsPerPage]) // Refetch when these dependencies change

//   // --- Page Change Handler ---
//   // Memoized with useCallback to prevent unnecessary re-renders of child components
//   const handlePageChange = useCallback((page: number) => {
//     setCurrentPage(page)
//   }, []) // Empty dependency array means the function is created only once

//   // --- Returned Values ---
//   // Expose state and the page change handler to the component using the hook
//   return {
//     currentPage,
//     reviews,
//     totalReviews,
//     totalPages,
//     loading,
//     error,
//     handlePageChange,
//   }
// }

export const usePaginatedReviews = (
  doctorId: string,
  currentPage: number,
  reviewsPerPage = 10
) => {
  return useQuery({
    queryKey: ['doctor-reviews', doctorId, currentPage, reviewsPerPage],
    queryFn: async () => {
      const response = await getDoctorReviewsPaginated(
        doctorId,
        currentPage,
        reviewsPerPage
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch reviews.')
      }

      return response.data
    },
    enabled: !!doctorId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  })
}
