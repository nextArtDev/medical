import { AppointmentStatus, LeaveType, Prisma } from '@/lib/generated/prisma'
import prisma from '@/lib/prisma'
import { getAppTimeZone } from '@/lib/utils'
import { endOfDay, getHours, parseISO, startOfDay } from 'date-fns-jalali'
import { toZonedTime } from 'date-fns-tz'
import { DepartmentData, SelectedAppointmentInfo } from './types'
import { ServerActionResponse } from '@/lib/actions'

export async function getDoctorAppointmentsForDateInternal(
  doctorId: string,
  dateStr: string,
  leaveType?: LeaveType
): Promise<SelectedAppointmentInfo[]> {
  const TIMEZONE = getAppTimeZone()
  const leaveDateStart = startOfDay(parseISO(dateStr))
  const leaveDateEnd = endOfDay(parseISO(dateStr))

  const timeFilter: Prisma.AppointmentWhereInput = {
    appointmentStartUTC: {
      gte: leaveDateStart,
      lte: leaveDateEnd,
    },
  }

  // Fetch all potentially conflicting appointments for the UTC day
  const potentiallyConflictingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctorId,
      status: {
        in: [AppointmentStatus.BOOKING_CONFIRMED, AppointmentStatus.CASH],
      },
      // Use the simplified timeFilter (just the date range)
      AND: [timeFilter],
    },
    select: {
      appointmentId: true,
      appointmentStartUTC: true,
      patientName: true,
      phoneNumber: true,
      status: true,
      user: {
        select: { email: true, phoneNumber: true, name: true },
      },
    },
    orderBy: {
      appointmentStartUTC: 'asc',
    },
  })

  let conflictingAppointments: SelectedAppointmentInfo[]

  if (leaveType === LeaveType.MORNING) {
    conflictingAppointments = potentiallyConflictingAppointments.filter(
      (apt) => {
        const zonedStartTime = toZonedTime(apt.appointmentStartUTC, TIMEZONE)
        const hourInAppZone = getHours(zonedStartTime)
        // Morning leave conflicts if appointment starts *before* 1 PM (13:00) in the app's timezone
        return hourInAppZone < 13
      }
    )
  } else if (leaveType === LeaveType.AFTERNOON) {
    conflictingAppointments = potentiallyConflictingAppointments.filter(
      (apt) => {
        const zonedStartTime = toZonedTime(apt.appointmentStartUTC, TIMEZONE)
        const hourInAppZone = getHours(zonedStartTime)
        // Afternoon leave conflicts if appointment starts *at or after* 1 PM (13:00) in the app's timezone
        return hourInAppZone >= 13
      }
    )
  } else {
    // For FULL_DAY or no leave type, all fetched appointments are considered conflicts
    conflictingAppointments = potentiallyConflictingAppointments
  }

  return conflictingAppointments
}

interface GetDepartmentData {
  departments: DepartmentData[]
}

export async function getDepartments(): Promise<
  ServerActionResponse<GetDepartmentData>
> {
  try {
    // Attempt to retrieve all departments from the database
    // The results are ordered by the 'createdAt' field in ascending order
    const departments = await prisma.department.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    })

    // If the query is successful, return a success response with the data
    return {
      success: true,
      data: { departments },
      message: 'Departments fetched successfully.',
    }
  } catch (error) {
    // Log the error to the console for debugging purposes
    console.error('Error fetching departments:', error)

    // If an error occurs, return a failure response
    return {
      success: false,
      message: 'failed to fetch departments',
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error fetching departments',
      errorType: 'SERVER_ERROR',
    }
  }
}
