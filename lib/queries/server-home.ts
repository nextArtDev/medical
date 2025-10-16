'use server'

import {
  ApiResponse,
  DoctorReview,
  DoctorReviewsPaginatedData,
  TimeSlot,
} from '@/types/home'
import prisma from '../prisma'
import { addMinutes, format, isSameDay, parse } from 'date-fns'
import { AppointmentStatus, LeaveType } from '../generated/prisma'
import { toZonedTime } from 'date-fns-tz'

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

interface GetAvailableSlotsParams {
  doctorId: string
  date: string //format - YYYY - MM-DD
  currentUserId?: string
}

export async function getAvailableDoctorSlots({
  doctorId,
  date,
  currentUserId,
}: GetAvailableSlotsParams): Promise<ApiResponse<TimeSlot[]>> {
  try {
    // --- 1. SETUP & PREREQUISITES ---

    const nowUTC = new Date() // Current moment in time, the date object's internal value is UTC based

    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      include: { doctorProfile: true },
    })

    if (!doctor || !doctor.doctorProfile) {
      return {
        success: false,
        message: 'Docotr not found',
        errorType: 'NOT_FOUND',
      }
    }

    // Fetch global application settings for slot generation.
    const appSettings = await prisma.appSettings.findFirst()
    if (!appSettings) {
      return {
        success: false,
        message: 'Application settings are not configured.',
        errorType: 'ConfigurationError',
      }
    }
    const { slotsPerHour, startTime, endTime } = appSettings
    const slotDurationInMinutes = 60 / slotsPerHour

    // --- 2. GENERATE ALL POTENTIAL SLOTS (MASTER LIST) ---

    const allPotentialSlots: TimeSlot[] = []
    // Convert the day's start and end times from app timezone to UTC.
    // const dayStartTimeUTC = fromZonedTime(`${date}T${startTime}`, appTimeZone)
    // const dayEndTimeUTC = fromZonedTime(`${date}T${endTime}`, appTimeZone)
    const dayStartTimeUTC = new Date(`${date}T${startTime}`)
    const dayEndTimeUTC = new Date(`${date}T${endTime}`)

    let currentSlotStartUTC = dayStartTimeUTC

    // Loop through the day and generate all possible slots.
    while (currentSlotStartUTC < dayEndTimeUTC) {
      const currentSlotEndUTC = addMinutes(
        currentSlotStartUTC,
        slotDurationInMinutes
      )

      // Ensure the generated slot does not exceed the doctor's end time.
      if (currentSlotEndUTC > dayEndTimeUTC) {
        break
      }

      allPotentialSlots.push({
        startTimeUTC: currentSlotStartUTC,
        endTimeUTC: currentSlotEndUTC,
        // Format display times in the application's local timezone.
        startTime: format(currentSlotStartUTC, 'HH:mm'),
        endTime: format(currentSlotEndUTC, 'HH:mm'),
      })

      currentSlotStartUTC = currentSlotEndUTC
    }

    let availableSlots = [...allPotentialSlots]

    // --- 3. FILTER UNAVAILABLE SLOTS (SUBTRACTION LOGIC) ---

    // A. Filter based on Doctor's Leave
    const leaveDate = new Date(date) // Prisma's @db.Date type maps to a JS Date at midnight UTC.
    const doctorLeave = await prisma.doctorLeave.findUnique({
      where: {
        doctorId_leaveDate: {
          doctorId,
          leaveDate: leaveDate,
        },
      },
    })

    if (doctorLeave) {
      if (doctorLeave.leaveType === LeaveType.FULL_DAY) {
        return { success: true, data: [], message: 'Full day on leave' } // Doctor is on leave the whole day.
      }

      // 1:00 PM in the app's timezone, converted to UTC.
      const afternoonStartUTC = new Date(`${date}T13:00:00`)

      if (doctorLeave.leaveType === LeaveType.MORNING) {
        availableSlots = availableSlots.filter(
          (slot) => slot.startTimeUTC >= afternoonStartUTC
        )
      } else if (doctorLeave.leaveType === LeaveType.AFTERNOON) {
        availableSlots = availableSlots.filter(
          (slot) => slot.startTimeUTC < afternoonStartUTC
        )
      }
    }

    // B. Filter based on Existing Appointments
    const dayStartInAppTz = `${date}T00:00:00`
    const dayEndInAppTz = `${date}T23:59:59`

    const appointmentsOnDate = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentStartUTC: {
          gte: dayStartInAppTz,
          lte: dayEndInAppTz,
        },
        status: {
          in: [
            AppointmentStatus.BOOKING_CONFIRMED,
            AppointmentStatus.CASH,
            AppointmentStatus.PAYMENT_PENDING,
          ],
        },
      },
      select: {
        appointmentStartUTC: true,
        status: true,
        reservationExpiresAt: true,
        userId: true,
      },
    })

    // Create a set of UTC start times for all "taken" slots for efficient lookup.
    const takenSlotTimesUTC = new Set<string>()
    appointmentsOnDate.forEach((appt) => {
      const isConfirmed =
        appt.status === AppointmentStatus.BOOKING_CONFIRMED ||
        appt.status === AppointmentStatus.CASH

      const isPendingAndActive =
        appt.status === AppointmentStatus.PAYMENT_PENDING &&
        appt.reservationExpiresAt &&
        appt.reservationExpiresAt > nowUTC

      // User-Specific Exception: A user's own pending slot should not be considered "taken".
      const isCurrentUserOwnPendingSlot =
        isPendingAndActive && currentUserId && appt.userId === currentUserId

      if ((isConfirmed || isPendingAndActive) && !isCurrentUserOwnPendingSlot) {
        takenSlotTimesUTC.add(appt.appointmentStartUTC.toISOString())
      }
    })

    if (takenSlotTimesUTC.size > 0) {
      availableSlots = availableSlots.filter(
        (slot) => !takenSlotTimesUTC.has(slot.startTimeUTC.toISOString())
      )
    }

    // C. Filter Past Slots for Today
    const requestedDateParsed = parse(date, 'yyyy-MM-dd', new Date())
    const isToday = isSameDay(nowUTC, requestedDateParsed)

    if (isToday) {
      availableSlots = availableSlots.filter(
        (slot) => slot.startTimeUTC > nowUTC
      )
    }

    // --- 4. FINALIZE AND RETURN ---
    return {
      success: true,
      data: availableSlots,
      message: 'available slots fetched successfully',
    }
  } catch (error) {
    // In a real application, you might use a more sophisticated logging service.
    console.error('Error in getAvailableDoctorSlots:', error)
    return {
      success: false,
      message: 'An unexpected error occurred while fetching available slots.',
      error: error instanceof Error ? error.message : 'Unknown server error',
      errorType: 'SERVER_ERROR',
    }
  }
}

interface PendingAppointmentParams {
  userId: string
  doctorId: string
}

interface PendingAppointmentData {
  appointment: {
    appointmentId: string
    date: string
    startTime: string
    endTime: string
    status: string
  } | null
}

export async function getPendingAppointmentForDoctor({
  userId,
  doctorId,
}: PendingAppointmentParams): Promise<ApiResponse<PendingAppointmentData>> {
  try {
    // 1. Find the most recent appointment with 'PAYMENT_PENDING' status
    //    where the reservation time has not expired.
    const pendingAppointment = await prisma.appointment.findFirst({
      where: {
        userId: userId,
        doctorId: doctorId,
        status: AppointmentStatus.PAYMENT_PENDING,
        reservationExpiresAt: {
          // Check that the reservation expiry time is in the future
          gt: new Date(),
        },
      },
      // Get the most recently created one if there are multiple
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        appointmentId: true,
        appointmentStartUTC: true,
        appointmentEndUTC: true,
        status: true,
      },
    })

    // 2. If no such appointment is found, return null.
    if (!pendingAppointment) {
      return {
        success: true,
        data: { appointment: null },
        message: 'No pending appointment found.',
      }
    }

    // Convert UTC dates from the database to zoned time objects
    const zonedStartTime = pendingAppointment.appointmentStartUTC
    const zonedEndTime = pendingAppointment.appointmentEndUTC

    // Format the zoned times into the required string formats
    const formattedDate = format(zonedStartTime, 'yyyy-MM-dd')
    const formattedStartTime = format(zonedStartTime, 'HH:mm')
    const formattedEndTime = format(zonedEndTime, 'HH:mm')

    // 4. Return the successfully retrieved and formatted appointment data.
    return {
      success: true,
      data: {
        appointment: {
          appointmentId: pendingAppointment.appointmentId,
          date: formattedDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          status: pendingAppointment.status,
        },
      },
      message: 'Successfully retrieved pending appointment.',
    }
  } catch (error) {
    console.error('Error fetching pending appointment:', error)
    // 5. Handle any potential errors during the database query.
    return {
      success: false,
      message:
        'Could not retrieve the pending appointment details at this time',
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch pending appointments',
      errorType: 'SERVER_ERROR',
    }
  }
}
