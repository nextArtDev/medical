import { revalidatePath } from 'next/cache'
import prisma from '../prisma'
import { AppointmentStatus } from '../generated/prisma'
import { FieldErrors } from 'react-hook-form'
import { currentUser } from '../auth'
import { fullReviewDataSchema } from '../schemas'

export interface ServerActionResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  errorType?: string
  fieldErrors?: FieldErrors
}
export async function cancelCashAppointment(
  appointmentId: string
): Promise<ServerActionResponse> {
  if (!appointmentId) {
    return {
      success: false,
      message: 'Appointment ID is required.',
      errorType: 'badRequest',
    }
  }
  try {
    // Step 1: Find the appointment by its ID
    const appointment = await prisma.appointment.findUnique({
      where: { appointmentId },
    })

    // Step 2: Handle case where appointment is not found
    if (!appointment) {
      return {
        success: false,
        message: 'Appointment not found.',
        errorType: 'notFound',
      }
    }

    // Step 3: Check if the appointment status is 'CASH'
    if (appointment.status !== AppointmentStatus.CASH) {
      return {
        success: false,
        message:
          'This appointment cannot be cancelled. This is not a cash payment appointment. Please call the Admin',
        errorType: 'InvalidStatus',
      }
    }

    // Step 4: Update the appointment status to 'CANCELLED'
    await prisma.appointment.update({
      where: { appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
      },
    })

    revalidatePath(`/user/profile`)
    // revalidatePath("/admin/appointments");

    // Step 6: Return a success response
    return {
      success: true,
      message: 'Appointment successfully cancelled.',
    }
  } catch (error) {
    // Step 7: Handle any unexpected errors
    console.error('Error cancelling cash appointment:', error)
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: 'SERVER_ERROR',
    }
  }
}

export async function submitPatientReview(clientData: {
  appointmentId: string
  doctorId: string
  rating: number
  reviewText: string
}): Promise<ServerActionResponse> {
  // 1. Check user authentication
  const session = await currentUser()
  if (!session?.id) {
    return {
      success: false,
      message: 'Authentication required. Please log in to submit a review.',
      errorType: 'Unauthorized',
    }
  }
  const patientId = session.id

  // 2. Validate the input data against the Zod schema
  const fullData = { ...clientData, patientId }
  const validationResult = fullReviewDataSchema.safeParse(fullData)

  if (!validationResult.success) {
    return {
      success: false,
      message: 'Invalid data provided. Please check your input.',
      fieldErrors: validationResult.error.flatten().fieldErrors,
      errorType: 'Validation Error',
    }
  }

  const { appointmentId, doctorId, rating, reviewText } = validationResult.data

  try {
    // 3. Use a transaction to ensure all database operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // 3a. Find the appointment and verify its status and ownership
      const appointment = await tx.appointment.findUnique({
        where: { appointmentId },
        include: { testimonial: true }, // Check if a testimonial already exists
      })

      if (!appointment) {
        throw new Error('Appointment not found.')
      }
      if (appointment.status !== AppointmentStatus.COMPLETED) {
        throw new Error(
          'Reviews can only be submitted for completed appointments.'
        )
      }
      if (appointment.userId !== patientId) {
        throw new Error('You are not authorized to review this appointment.')
      }
      if (appointment.testimonial) {
        throw new Error(
          'A review has already been submitted for this appointment.'
        )
      }

      // 3b. Create the new testimonial
      await tx.doctorTestimonial.create({
        data: {
          appointmentId,
          doctorId,
          patientId,
          rating,
          testimonialText: reviewText,
        },
      })

      // 3c. Calculate the new average rating and review count for the doctor
      const stats = await tx.doctorTestimonial.aggregate({
        where: { doctorId },
        _avg: {
          rating: true,
        },
        _count: {
          testimonialId: true,
        },
      })

      const reviewCount = stats._count.testimonialId
      const averageRating = stats._avg.rating || 0

      // 3d. Update the doctor's profile with the new stats
      await tx.doctorProfile.update({
        where: { userId: doctorId },
        data: {
          reviewCount,
          rating: parseFloat(averageRating.toFixed(1)), // Store with 1 decimal places
        },
      })

      //return testimonial;
    })

    // 4. Revalidate paths to update the UI
    revalidatePath(`/user/profile`) // Revalidate

    // 5. Return a success response
    return {
      success: true,
      message: 'Your review has been submitted successfully!',
      //data: newTestimonial,
    }
  } catch (error) {
    // 6. Handle any errors that occurred during the process
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.'
    console.error('Error submitting patient review:', error)
    return {
      success: false,
      message: errorMessage,
      error: errorMessage,
      errorType: 'SERVER_ERROR',
    }
  }
}
