import { useRef, useEffect } from 'react'
import { useInView } from 'framer-motion'
import {
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query'

interface UseInfiniteScrollOptions<TData, TError> {
  queryKey: unknown[]
  queryFn: (context: { pageParam: unknown }) => Promise<TData>
  getNextPageParam: (lastPage: TData) => number | undefined
  enabled?: boolean
  staleTime?: number
  triggerMargin?:
    | `${number}px`
    | `${number}%`
    | `${number}px ${number}px`
    | `${number}px ${number}px ${number}px ${number}px`
  initialPageParam?: number
}

interface PaginatedResponse<T> {
  data: T[]
  currentPage: number
  totalPages: number
  totalItems: number
}

export function useInfiniteScroll<
  TData extends PaginatedResponse<any>,
  TError = Error
>({
  queryKey,
  queryFn,
  getNextPageParam,
  enabled = true,
  staleTime = 1000 * 60 * 5,
  triggerMargin = '100px',
  initialPageParam = 1,
}: UseInfiniteScrollOptions<TData, TError>) {
  // Setup infinite query
  const query = useInfiniteQuery<
    TData,
    TError,
    { pages: TData[]; pageParams: unknown[] }
  >({
    queryKey,
    queryFn,
    getNextPageParam,
    initialPageParam,
    enabled,
    staleTime,
  })

  // Setup intersection observer with Framer Motion
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(loadMoreRef, {
    margin: triggerMargin,
  })

  // Trigger fetchNextPage when in view
  useEffect(() => {
    if (isInView && query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage()
    }
  }, [
    isInView,
    query.hasNextPage,
    query.isFetchingNextPage,
    query.fetchNextPage,
  ])

  // Flatten all pages into a single array
  const allData = query.data?.pages.flatMap((page) => page.data) ?? []

  // Get metadata from first page
  const totalItems = query.data?.pages[0]?.totalItems ?? 0
  const totalPages = query.data?.pages[0]?.totalPages ?? 0
  const currentLoadedPages = query.data?.pages.length ?? 0

  return {
    // Query states
    ...query,

    // Flattened data
    allData,

    // Metadata
    totalItems,
    totalPages,
    currentLoadedPages,

    // Load more trigger ref
    loadMoreRef,
  }
}

// Usage Example:
// import { getDoctorReviewsPaginated } from '@/lib/queries/home'
// import { useInfiniteScroll } from './use-infinite-scroll'
// import type { DoctorReview } from '@/types/home'

// export const useInfiniteReviews = (doctorId: string, reviewsPerPage = 10) => {
//   return useInfiniteScroll({
//     queryKey: ['doctor-reviews-infinite', doctorId, reviewsPerPage],
//     queryFn: async ({ pageParam }) => {
//       const response = await getDoctorReviewsPaginated(
//         doctorId,
//         pageParam,
//         reviewsPerPage
//       )

//       if (!response.success || !response.data) {
//         throw new Error(response.message || 'Failed to fetch reviews.')
//       }

//       // Transform to match PaginatedResponse structure
//       return {
//         data: response.data.reviews,
//         currentPage: response.data.currentPage,
//         totalPages: response.data.totalPages,
//         totalItems: response.data.totalReviews,
//       }
//     },
//     getNextPageParam: (lastPage) => {
//       if (lastPage.currentPage < lastPage.totalPages) {
//         return lastPage.currentPage + 1
//       }
//       return undefined
//     },
//     enabled: !!doctorId,
//     triggerMargin: '100px',
//   })
// }

// // components/patient-reviews.tsx
// ;('use client')
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { ScrollArea } from '@/components/ui/scroll-area'
// import ReviewList from './review-list'
// import { useInfiniteReviews } from '@/hooks/use-infinite-reviews'
// import RatingStars from '@/components/shared/star-rating'
// import { Loader2 } from 'lucide-react'
// import { motion } from 'framer-motion'

// interface PatientReviewsProps {
//   doctorId: string
//   averageRating: number
// }

// export default function PatientReviews({
//   doctorId,
//   averageRating,
// }: PatientReviewsProps) {
//   const {
//     allData: reviews,
//     totalItems: totalReviews,
//     totalPages,
//     currentLoadedPages,
//     isLoading,
//     error,
//     hasNextPage,
//     isFetchingNextPage,
//     loadMoreRef,
//   } = useInfiniteReviews(doctorId, 10)

//   const renderContent = () => {
//     if (isLoading) {
//       return (
//         <div className="flex items-center justify-center py-8">
//           <Loader2 className="h-6 w-6 animate-spin" />
//           <span className="ml-2">Loading reviews...</span>
//         </div>
//       )
//     }

//     if (error) {
//       return (
//         <p className="text-center py-4 text-red-500">
//           Error:{' '}
//           {error instanceof Error ? error.message : 'Failed to load reviews'}
//         </p>
//       )
//     }

//     if (reviews.length === 0) {
//       return <p className="text-center py-4">No reviews found.</p>
//     }

//     return (
//       <ScrollArea className="h-[70vh] pr-4">
//         <ReviewList reviews={reviews} />

//         {hasNextPage && (
//           <motion.div
//             ref={loadMoreRef}
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             className="flex justify-center py-6"
//           >
//             {isFetchingNextPage && (
//               <motion.div
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className="flex items-center"
//               >
//                 <Loader2 className="h-5 w-5 animate-spin" />
//                 <span className="ml-2 text-sm text-muted-foreground">
//                   Loading more reviews...
//                 </span>
//               </motion.div>
//             )}
//           </motion.div>
//         )}

//         {!hasNextPage && reviews.length > 0 && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ delay: 0.2 }}
//             className="text-center py-6"
//           >
//             <p className="text-sm text-muted-foreground">
//               You've reached the end
//             </p>
//           </motion.div>
//         )}
//       </ScrollArea>
//     )
//   }

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Patient Reviews</CardTitle>
//         <div className="flex items-center gap-2 mt-2">
//           <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
//           <div className="flex flex-col">
//             <RatingStars rating={averageRating} />
//             <p className="text-sm text-muted-foreground">
//               {totalReviews} reviews
//             </p>
//           </div>
//         </div>
//         {reviews.length > 0 && (
//           <motion.p
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             className="text-xs text-muted-foreground mt-2"
//           >
//             Showing {reviews.length} of {totalReviews}
//             {totalPages > 1 && ` (Page ${currentLoadedPages} of ${totalPages})`}
//           </motion.p>
//         )}
//       </CardHeader>
//       <CardContent className="p-0">
//         <div className="px-6 pb-6">{renderContent()}</div>
//       </CardContent>
//     </Card>
//   )
// }

// // ============================================
// // EXAMPLE USAGE 2: Blog Posts
// // ============================================

// // hooks/use-infinite-posts.ts
// import { getPosts } from '@/lib/queries/posts'
// import { useInfiniteScroll } from './use-infinite-scroll'

// export const useInfinitePosts = (category?: string) => {
//   return useInfiniteScroll({
//     queryKey: ['posts-infinite', category],
//     queryFn: async ({ pageParam }) => {
//       const response = await getPosts({ page: pageParam, category })
//       return {
//         data: response.posts,
//         currentPage: response.currentPage,
//         totalPages: response.totalPages,
//         totalItems: response.total,
//       }
//     },
//     getNextPageParam: (lastPage) => {
//       return lastPage.currentPage < lastPage.totalPages
//         ? lastPage.currentPage + 1
//         : undefined
//     },
//     triggerMargin: '200px', // Custom trigger distance
//   })
// }

// // ============================================
// // EXAMPLE USAGE 3: Products
// // ============================================

// // hooks/use-infinite-products.ts
// import { getProducts } from '@/lib/queries/products'
// import { useInfiniteScroll } from './use-infinite-scroll'

// export const useInfiniteProducts = (filters?: { search?: string }) => {
//   return useInfiniteScroll({
//     queryKey: ['products-infinite', filters],
//     queryFn: async ({ pageParam }) => {
//       const response = await getProducts({
//         page: pageParam,
//         ...filters,
//       })
//       return {
//         data: response.products,
//         currentPage: response.page,
//         totalPages: response.totalPages,
//         totalItems: response.totalProducts,
//       }
//     },
//     getNextPageParam: (lastPage) => {
//       return lastPage.currentPage < lastPage.totalPages
//         ? lastPage.currentPage + 1
//         : undefined
//     },
//     enabled: true,
//     staleTime: 1000 * 60 * 2, // 2 minutes
//   })
// }
