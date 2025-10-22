'use server'
import { revalidatePath } from 'next/cache'
import prisma from '../prisma'
import { AppointmentStatus, Prisma } from '../generated/prisma'
import { FieldErrors } from 'react-hook-form'

import { fullReviewDataSchema, PatientDetailsFormSchema } from '../schemas'
import {
  ApiResponse,
  AppointmentReservationParams,
  AppointmentSubmissionData,
  GuestAppointmentParams,
  GuestAppointmentSuccessData,
  ReservationSuccessData,
  UserProfile,
} from '@/types/home'
import { getAppTimeZone } from '../utils'
import { fromZonedTime } from 'date-fns-tz'
import { addMinutes, isValid, parse } from 'date-fns-jalali'
import { v4 as uuidv4 } from 'uuid'
import { currentUser } from '../auth-helpers'

export interface ServerActionResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  errorType?: string
  fieldErrors?: Record<string, string[] | undefined>
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

export async function updateUserProfile(
  data: Partial<UserProfile>
): Promise<ApiResponse<UserProfile>> {
  try {
    const user = await currentUser()
    if (!user?.id) {
      return {
        success: false,
        message: 'User not authenticated',
        error: 'Unauthorized. You must be logged in to update your profile.',
        errorType: 'authentication',
      }
    }
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        // dateOfBirth: true,
        phoneNumber: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return { success: true, data: updatedUser as UserProfile }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return { success: false, error: 'Failed to update user profile' }
  }
}

export async function createOrUpdateAppointmentReservation({
  doctorId,
  userId,
  date,
  startTime,
  endTime,
}: AppointmentReservationParams): Promise<
  ServerActionResponse<ReservationSuccessData>
> {
  try {
    // 1. Authenticate and authorize the user
    const session = await currentUser()
    if (!session || !session.id) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'You must be logged in.',
        errorType: 'UNAUTHENTICATED',
      }
    }
    if (session.id !== userId) {
      return {
        success: false,
        message: 'You are not authorized to perform this action',
        error: 'Authorization failed.',
        errorType: 'UNAUTHORIZED',
      }
    }

    // 2. Prepare time data and calculate expiration
    const appTimeZone = getAppTimeZone()
    const appointmentStartUTC = fromZonedTime(
      `${date}T${startTime}`,
      appTimeZone
    )
    const appointmentEndUTC = fromZonedTime(`${date}T${endTime}`, appTimeZone)

    const appSettings = await prisma.appSettings.findUnique({
      where: { id: 'global' },
    })
    const reservationDuration = appSettings?.slotReservationDuration ?? 10
    const reservationExpiresAt = addMinutes(new Date(), reservationDuration)

    // 3. Check for an existing pending reservation for this user and doctor
    const existingPendingReservation = await prisma.appointment.findFirst({
      where: {
        userId: session.id,
        doctorId: doctorId,
        status: AppointmentStatus.PAYMENT_PENDING,
        reservationExpiresAt: { gt: new Date() },
      },
    })

    let savedAppointment
    let message

    if (existingPendingReservation) {
      // --- UPDATE PATH ---
      // 4a. Check if the new slot is available, excluding the current reservation from the check
      const isSlotAvailable = await checkSlotAvailability(
        doctorId,
        appointmentStartUTC,
        appointmentEndUTC,
        existingPendingReservation.appointmentId // Pass existing ID to avoid self-conflict
      )

      if (!isSlotAvailable) {
        return {
          success: false,
          message:
            'The selected slot is no longer available. Please choose another time',
          error: 'This time slot is not available. Please select another.',
          errorType: 'SLOT_UNAVAILABLE',
        }
      }

      // 5a. Update the existing appointment
      savedAppointment = await prisma.appointment.update({
        where: { appointmentId: existingPendingReservation.appointmentId },
        data: {
          appointmentStartUTC,
          appointmentEndUTC,
          reservationExpiresAt, // Refresh the reservation timer
        },
      })
      message = 'Your appointment time has been successfully updated.'
    } else {
      // --- CREATE PATH ---
      // 4b. Check if the requested slot is available
      const isSlotAvailable = await checkSlotAvailability(
        doctorId,
        appointmentStartUTC,
        appointmentEndUTC
      )

      if (!isSlotAvailable) {
        return {
          success: false,
          message:
            'The selected appointment slot is no longer available. Please choose another time',
          error: 'This time slot is not available. Please select another.',
          errorType: 'SLOT_UNAVAILABLE',
        }
      }

      // 5b. Create a new appointment
      savedAppointment = await prisma.appointment.create({
        data: {
          doctorId,
          userId: session.id,
          patientType: 'MYSELF',
          patientName: session.name ?? 'User', // Use name from session, with a fallback
          appointmentStartUTC,
          appointmentEndUTC,
          reservationExpiresAt,
          status: AppointmentStatus.PAYMENT_PENDING,
        },
      })
      message = 'Appointment slot reserved successfully.'
    }

    // 6. Revalidate the path to update UI
    revalidatePath(`/doctors/${doctorId}`)

    // 7. Return success response
    return {
      success: true,
      message,
      data: { appointmentId: savedAppointment.appointmentId },
    }
  } catch (error) {
    console.error('Error in createOrUpdateAppointmentReservation:', error)
    return {
      success: false,
      message: 'Failed to complete your reservation due to a server issue',
      error: error instanceof Error ? error.message : 'Unknow error occured',
      errorType: 'SERVER_ERROR',
    }
  }
}

async function checkSlotAvailability(
  doctorId: string,
  startTime: Date,
  endTime: Date,
  currentAppointmentId?: string
): Promise<boolean> {
  try {
    // Build the base query to find a conflicting appointment
    const whereClause: Prisma.AppointmentWhereInput = {
      AND: [
        { doctorId: doctorId },
        { appointmentStartUTC: startTime },
        { appointmentEndUTC: endTime },
        {
          OR: [
            // Case 1: The appointment is confirmed by payment or cash.
            {
              status: {
                in: [
                  AppointmentStatus.BOOKING_CONFIRMED,
                  AppointmentStatus.CASH,
                ],
              },
            },
            // Case 2: The appointment is pending payment but the reservation has not expired.
            {
              AND: [
                { status: AppointmentStatus.PAYMENT_PENDING },
                { reservationExpiresAt: { gt: new Date() } },
              ],
            },
          ],
        },
      ],
    }

    // If rescheduling, exclude the current appointment from the conflict check
    if (currentAppointmentId) {
      if (whereClause.AND && Array.isArray(whereClause.AND)) {
        whereClause.AND.push({
          appointmentId: {
            not: currentAppointmentId,
          },
        })
      }
    }

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: whereClause,
    })

    // If a conflicting appointment is found, the slot is not available.
    // If no conflict is found (conflictingAppointment is null), the slot is available.
    return !conflictingAppointment
  } catch (error) {
    console.error('Error checking slot availability:', error)
    // In case of a database error, assume the slot is not available to be safe.
    return false
  }
}

export async function createGuestAppointment({
  doctorId,
  date,
  startTime,
  endTime,
}: GuestAppointmentParams): Promise<
  ServerActionResponse<GuestAppointmentSuccessData>
> {
  try {
    // 1. Generate a unique identifier for the guest
    const guestIdentifier = uuidv4()
    const appTimeZone = getAppTimeZone()

    // 2. Convert local time strings to UTC Date objects
    const appointmentStartUTC = fromZonedTime(
      `${date}T${startTime}`, // 2025-05-10T14:00
      appTimeZone
    )
    const appointmentEndUTC = fromZonedTime(`${date}T${endTime}`, appTimeZone)

    // 3. Check if the slot is still available
    const isSlotAvailable = await checkSlotAvailability(
      doctorId,
      appointmentStartUTC,
      appointmentEndUTC
    )

    if (!isSlotAvailable) {
      return {
        success: false,
        message:
          'This time slot is no longer available. Please select another time.',
        error:
          'This time slot is no longer available. Please select another time.',
        errorType: 'SLOT_UNAVAILABLE',
      }
    }

    // 4. Calculate the reservation expiration time
    const appSettings = await prisma.appSettings.findUnique({
      where: { id: 'global' },
    })
    const reservationDuration = appSettings?.slotReservationDuration ?? 10 // Default to 10 minutes
    const reservationExpiresAt = addMinutes(new Date(), reservationDuration)

    // 5. Create the appointment with a 'PAYMENT_PENDING' status
    const newAppointment = await prisma.appointment.create({
      data: {
        doctorId,
        guestIdentifier,
        userId: null, // Explicitly null for guest users
        patientType: 'MYSELF',
        patientName: 'Guest User', // Placeholder name for guest
        appointmentStartUTC,
        appointmentEndUTC,
        reservationExpiresAt,
        status: AppointmentStatus.PAYMENT_PENDING,
      },
    })

    // 6. Revalidate the doctor's schedule page to show the pending slot
    revalidatePath(`/doctors/${doctorId}`)

    // 7. On success, return the new appointmentId and guestIdentifier
    return {
      success: true,
      message: 'Appointment slot reserved successfully.',
      data: {
        appointmentId: newAppointment.appointmentId,
        guestIdentifier: newAppointment.guestIdentifier!, // Non-null assertion as it's just been set
      },
    }
  } catch (error) {
    console.error('Error creating guest appointment:', error)
    return {
      success: false,
      message:
        'An unexpected error occurred while booking the appointment. Please try again later.',
      error: error instanceof Error ? error.message : 'Unkown error',
      errorType: 'SERVER_ERROR',
    }
  }
}

export async function updateGuestAppointmentWithUser(
  guestIdentifier: string
): Promise<ServerActionResponse<{ appointmentId?: string }>> {
  // 1. Authenticate the user
  const session = await currentUser()
  if (!session?.id) {
    return {
      success: false,
      errorType: 'AUTHENTICATION_ERROR',
      error: 'User is not authenticated.',
      message: 'You must be logged in to claim an appointment.',
    }
  }
  const userId = session.id

  // 2. Validate input
  if (!guestIdentifier) {
    return {
      success: false,
      errorType: 'VALIDATION_ERROR',
      error: 'Guest identifier is missing.',
      message: 'We were not able to find your appointment. Please try again',
    }
  }

  try {
    // 3. Find the guest appointment that is not expired and not already claimed
    const appointmentToClaim = await prisma.appointment.findFirst({
      where: {
        guestIdentifier: guestIdentifier,
        userId: null, // Ensure it's a guest appointment that hasn't been claimed
        reservationExpiresAt: {
          gt: new Date(), // Check that the reservation slot has not expired
        },
      },
    })

    // 4. Handle if appointment is not found, expired, or already claimed
    if (!appointmentToClaim) {
      return {
        success: false,
        errorType: 'NOT_FOUND',
        error: 'Appointment not found or expired.',
      }
    }

    // 5. Update the appointment record with the user's ID
    const updatedAppointment = await prisma.appointment.update({
      where: {
        appointmentId: appointmentToClaim.appointmentId,
      },
      data: {
        userId: userId,
        // It's good practice to nullify the guest identifier after it's been used
        guestIdentifier: null,
      },
    })

    // 6. Return a success response
    return {
      success: true,
      message: 'Appointment has been successfully linked to your account.',
      data: { appointmentId: updatedAppointment.appointmentId },
    }
  } catch (error) {
    console.error('Error updating guest appointment with user:', error)
    return {
      success: false,
      errorType: 'SERVER_ERROR',
      error: error instanceof Error ? error.message : 'An unkown error occured',
      message: 'An unexpected error occurred while updating the appointment.',
    }
  }
}

interface AppointmentData {
  appointmentId?: string
}

export async function processAppointmentBooking(
  data: AppointmentSubmissionData
): Promise<ServerActionResponse<AppointmentData>> {
  // 1. Check for authenticated user
  const session = await currentUser()
  if (!session?.id) {
    return {
      success: false,
      error: 'Authentication required. Please sign in to book an appointment.',
      errorType: 'AUTH_ERROR',
    }
  }
  const userId = session.id

  // 2. Validate form data
  const validationResult = PatientDetailsFormSchema.safeParse(data)
  if (!validationResult.success) {
    return {
      success: false,
      message: 'Please correct the errors below.',
      fieldErrors: validationResult.error.flatten().fieldErrors,
      errorType: 'VALIDATION_ERROR',
    }
  }
  const validatedData = validationResult.data

  try {
    const appTimeZone = getAppTimeZone() // e.g., 'Asia/Kolkata'

    // 3. Convert local time slot to UTC Dates for database storage
    // Assumes `data.date` is in a format like 'YYYY-MM-DD'
    const appointmentStartUTC = fromZonedTime(
      `${data.date} ${data.timeSlot}`,
      appTimeZone
    )
    const appointmentEndUTC = fromZonedTime(
      `${data.date} ${data.endTime}`,
      appTimeZone
    )

    // Parse patient's date of birth if provided
    let patientDob: Date | null = null
    if (
      // validatedData.patientType === "SOMEONE_ELSE" &&
      // validatedData.dateOfBirth
      data.patientdateofbirth
    ) {
      const parsedDob = parse(
        data.patientdateofbirth,
        // "dd/MM/yyyy",
        'yyyy-MM-dd',
        new Date()
      )
      if (isValid(parsedDob)) {
        patientDob = parsedDob
      }
    }

    const { appointmentId, doctorId } = data
    let finalAppointmentId: string | undefined = appointmentId

    // 4. Find the original appointment reservation
    const existingAppointment = appointmentId
      ? await prisma.appointment.findFirst({
          where: {
            appointmentId: appointmentId,
            userId: userId, // Ensure user can only access their own appointments
          },
        })
      : null

    const isReservationValid =
      existingAppointment &&
      existingAppointment.reservationExpiresAt &&
      existingAppointment.reservationExpiresAt > new Date()

    // 5. Decide whether to UPDATE or CREATE
    if (isReservationValid && existingAppointment) {
      // --- Scenario 1: Reservation is valid, UPDATE the appointment ---
      await prisma.appointment.update({
        where: { appointmentId: existingAppointment.appointmentId },
        data: {
          patientType: validatedData.patientType,
          patientName: validatedData.fullName,
          patientRelation:
            validatedData.patientType === 'SOMEONE_ELSE'
              ? validatedData.relationship
              : null,
          phoneNumber: data.phone,
          patientDateOfBirth: patientDob,
          reasonForVisit: validatedData.reason,
          additionalNotes: validatedData.notes,
        },
      })
      finalAppointmentId = existingAppointment.appointmentId
    } else {
      // --- Scenario 2 & 3: Reservation expired or not found, try to CREATE a new one ---

      // First, check if the desired slot has been taken by someone else
      const isSlotAvailable = await checkSlotAvailability(
        doctorId,
        appointmentStartUTC,
        appointmentEndUTC
      )

      if (!isSlotAvailable) {
        return {
          success: false,
          message:
            'Your appointment reservation for the selection slot has expired. Please select another slot',
          error:
            'This time slot is no longer available. Please select a different one.',
          errorType: 'SLOT_UNAVAILABLE',
        }
      }

      // Slot is available, so create a new appointment with a new reservation window
      const settings = await prisma.appSettings.findUnique({
        where: { id: 'global' },
      })
      const reservationDuration = settings?.slotReservationDuration ?? 10 // Fallback to 10 mins
      const reservationExpiresAt = new Date(
        Date.now() + reservationDuration * 60 * 1000
      )

      const newAppointment = await prisma.appointment.create({
        data: {
          doctorId: doctorId,
          userId: userId,
          appointmentStartUTC: appointmentStartUTC,
          appointmentEndUTC: appointmentEndUTC,
          status: 'PAYMENT_PENDING',
          reservationExpiresAt: reservationExpiresAt,
          patientType: validatedData.patientType,
          patientName: validatedData.fullName,
          patientRelation:
            validatedData.patientType === 'SOMEONE_ELSE'
              ? validatedData.relationship
              : null,
          phoneNumber: data.phone,
          patientDateOfBirth: patientDob,
          reasonForVisit: validatedData.reason,
          additionalNotes: validatedData.notes,
        },
      })
      finalAppointmentId = newAppointment.appointmentId
    }

    // 6. Revalidate the cache and return a success response
    if (finalAppointmentId) {
      revalidatePath(
        `/appointments/patient-details?appointmentId=${finalAppointmentId}`
      )
    }

    return {
      success: true,
      message: 'Appointment details saved successfully.',
      data: {
        appointmentId: finalAppointmentId,
      },
    }
  } catch (error) {
    console.error('Error in processAppointmentBooking:', error)
    return {
      success: false,
      message: 'An unexpected server error occurred. Please try again later.',
      error: error instanceof Error ? error.message : 'An unkown error occured',
      errorType: 'SERVER_ERROR',
    }
  }
}
