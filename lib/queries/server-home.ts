'use server'

import {
  ApiResponse,
  DoctorReview,
  DoctorReviewsPaginatedData,
} from '@/types/home'
import prisma from '../prisma'
import { format } from 'date-fns'

export async function getDoctorReviewsPaginated(
  doctorId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<DoctorReviewsPaginatedData>> {
  // const timeZone = getAppTimeZone() // datetime is stored in UTC in the
  // database and we want to show it in the local timezoen in the FE
  try {
    // --- 1. Validation ---
    // Ensure the page number is a positive integer.
    const pageNumber = Math.max(1, page)
    const offset = (pageNumber - 1) * pageSize
    //100 reviews , pageSize=10 , current = 2  , offset = (2-1)*10 = 10

    // --- 2. Database Queries (executed in parallel) ---
    const [totalReviews, testimonials] = await prisma.$transaction([
      // Query 1: Get the total count of testimonials for the doctor
      prisma.doctorTestimonial.count({
        where: { doctorId },
      }),
      // Query 2: Get the paginated list of testimonials
      prisma.doctorTestimonial.findMany({
        where: { doctorId },
        // Include related patient data to get name and image
        include: {
          patient: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        // Order by the most recent testimonials first
        orderBy: {
          createdAt: 'desc',
        },
        // Apply pagination
        skip: offset,
        take: pageSize,
      }),
    ])

    // console.log(' testimonial.testimonialText', totalReviews)
    // --- 3. Handle No Reviews Case ---
    if (totalReviews === 0) {
      return {
        success: true,
        data: {
          reviews: [],
          totalReviews: 0,
          totalPages: 0,
          currentPage: 1,
        },
      }
    }

    // --- 4. Data Transformation ---
    // Map the Prisma model to the DoctorReview interface
    const reviews: DoctorReview[] = testimonials.map((testimonial) => {
      // Convert the UTC date from the database to the specified timezone
      // const zonedDate = toZonedTime(testimonial.createdAt, timeZone)
      // Format the zoned date into a readable string
      const formattedDate = format(testimonial.createdAt, 'MMMM d, yyyy')
      return {
        id: testimonial.testimonialId,
        rating: testimonial.rating,
        reviewDate: formattedDate,
        testimonialText: testimonial.testimonialText,
        patientName: testimonial.patient.name,
        patientImage: testimonial.patient.image,
      }
    })

    // --- 5. Calculate Pagination Details ---
    const totalPages = Math.ceil(totalReviews / pageSize)
    //reviews = 100 , page size = 9 , 100/9 = 11 pages = 99 reviews , 1 page with 1 review

    // --- 6. Return Success Response ---
    return {
      success: true,
      data: {
        reviews,
        totalReviews,
        totalPages,
        currentPage: pageNumber,
      },
    }
  } catch (error) {
    // --- 7. Error Handling ---
    console.error('Error in getDoctorReviewsPaginated:', error)
    return {
      success: false,
      message: 'failed to fetch doctor reviews',
      error:
        error instanceof Error ? error.message : 'An unknown error occurred.',
      errorType: 'SERVER_ERROR',
    }
  }
}
