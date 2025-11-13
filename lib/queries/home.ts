'use server'
import {
  ApiResponse,
  UserProfile,
  DoctorProfile,
  DoctorWithProfile,
  Appointment,
  AppointmentSlot,
  AppointmentBookingInput,
  DoctorLeave,
  DoctorAvailability,
  Department,
  FAQ,
  DoctorTestimonial,
  Order,
  PaymentDetails,
  AppSettings,
  WorkingDay,
  DoctorDashboard,
  PatientDashboard,
  AdminDashboard,
  DoctorSearchFilters,
  AppointmentSearchFilters,
  PaginatedResult,
  DoctorReviewsPaginatedData,
  DoctorReview,
  PatientProfile,
  ConfirmationDetailsData,
} from '@/types/home'
import prisma from '../prisma'
import { format, toZonedTime } from 'date-fns-tz'
import { getAppTimeZone } from '../utils'
import {
  AppointmentStatus,
  PaymentStatus,
  Prisma,
  User,
} from '../generated/prisma'
import { currentUser } from '../auth-helpers'

// User related queries
export async function getUserById(
  id: string
): Promise<ApiResponse<UserProfile>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        dateOfBirth: true,
        phoneNumber: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    return { success: true, data: user as UserProfile }
  } catch (error) {
    console.error('Error fetching user:', error)
    return { success: false, error: 'Failed to fetch user' }
  }
}

export async function getUserByEmail(
  email: string
): Promise<ApiResponse<UserProfile>> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        dateOfBirth: true,
        phoneNumber: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    return { success: true, data: user as UserProfile }
  } catch (error) {
    console.error('Error fetching user by email:', error)
    return { success: false, error: 'Failed to fetch user' }
  }
}

// Doctor related queries
export async function getDoctorProfile(
  userId: string
): Promise<ApiResponse<DoctorWithProfile>> {
  if (!userId) {
    return {
      success: false,
      message: 'Doctor ID is required.',
    }
  }

  try {
    const doctor = await prisma.user.findUnique({
      where: {
        id: userId,
        role: 'doctor',
        isActive: true, //<--- ADD THIS LINE
      },
      include: {
        doctorProfile: true,
        images: { select: { url: true } },
      },
    })

    if (!doctor || !doctor.doctorProfile) {
      return { success: false, error: 'Doctor profile not found' }
    }

    const { doctorProfile, ...userProfile } = doctor
    const result = {
      ...userProfile,
      doctorProfile,
    } as unknown as DoctorWithProfile

    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching doctor profile:', error)
    return { success: false, error: 'Failed to fetch doctor profile' }
  }
}

export async function getAllDoctors(
  filters?: DoctorSearchFilters
): Promise<ApiResponse<PaginatedResult<DoctorWithProfile>>> {
  try {
    const {
      specialty,
      rating,
      availableDate,
      page = 1,
      limit = 10,
    } = filters || {}
    const skip = (page - 1) * limit

    let whereClause: any = {
      role: 'doctor',
      isActive: true,
      doctorProfile: {
        isActive: true,
      },
    }

    if (specialty) {
      whereClause.doctorProfile.specialty = {
        contains: specialty,
        mode: 'insensitive',
      }
    }

    if (rating) {
      whereClause.doctorProfile.rating = {
        gte: rating,
      }
    }

    // If availableDate is provided, filter out doctors who are on leave on that date
    if (availableDate) {
      const startOfDay = new Date(availableDate)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(availableDate)
      endOfDay.setHours(23, 59, 59, 999)

      whereClause.doctorLeaves = {
        none: {
          leaveDate: {
            gte: new Date(startOfDay),
            lte: new Date(endOfDay),
          },
        },
      }
    }

    const doctors = await prisma.user.findMany({
      where: whereClause,
      include: {
        doctorProfile: true,
        images: {
          select: {
            url: true,
          },
          take: 1,
        },
      },
      skip,
      take: limit,
      orderBy: {
        doctorProfile: {
          rating: 'desc',
        },
      },
    })

    const total = await prisma.user.count({
      where: whereClause,
    })

    const result: PaginatedResult<DoctorWithProfile> = {
      data: doctors.map((doctor) => {
        const { doctorProfile, ...userProfile } = doctor
        return {
          ...userProfile,
          doctorProfile,
        } as unknown as DoctorWithProfile
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching doctors:', error)
    return { success: false, error: 'Failed to fetch doctors' }
  }
}

// export async function updateDoctorProfile(
//   userId: string,
//   data: Partial<DoctorProfile>
// ): Promise<ApiResponse<DoctorProfile>> {
//   try {
//     const updatedProfile = await prisma.doctorProfile.update({
//       where: { userId },
//       data,
//     })

//     return { success: true, data: updatedProfile }
//   } catch (error) {
//     console.error('Error updating doctor profile:', error)
//     return { success: false, error: 'Failed to update doctor profile' }
//   }
// }

// Appointment related queries
export async function getAppointmentById(
  id: string
): Promise<ApiResponse<Appointment>> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { appointmentId: id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },

        Order: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!appointment) {
      return { success: false, error: 'Appointment not found' }
    }

    return { success: true, data: appointment as unknown as Appointment }
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return { success: false, error: 'Failed to fetch appointment' }
  }
}

export async function getAppointmentsByDoctorId(
  doctorId: string,
  filters?: AppointmentSearchFilters
): Promise<ApiResponse<PaginatedResult<Appointment>>> {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = filters || {}
    const skip = (page - 1) * limit

    let whereClause: any = {
      doctorId,
    }

    if (status) {
      whereClause.status = status
    }

    if (startDate && endDate) {
      whereClause.appointmentStartUTC = {
        gte: startDate,
        lte: endDate,
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        appointmentStartUTC: 'desc',
      },
    })

    const total = await prisma.appointment.count({
      where: whereClause,
    })

    const result: PaginatedResult<Appointment> = {
      data: appointments as Appointment[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching appointments by doctor ID:', error)
    return { success: false, error: 'Failed to fetch appointments' }
  }
}

export async function getAppointmentsByUserId(
  userId: string,
  filters?: AppointmentSearchFilters
): Promise<ApiResponse<PaginatedResult<Appointment>>> {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = filters || {}
    const skip = (page - 1) * limit

    let whereClause: any = {
      userId,
    }

    if (status) {
      whereClause.status = status
    }

    if (startDate && endDate) {
      whereClause.appointmentStartUTC = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        appointmentStartUTC: 'desc',
      },
    })

    const total = await prisma.appointment.count({
      where: whereClause,
    })

    const result: PaginatedResult<Appointment> = {
      data: appointments as Appointment[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching appointments by user ID:', error)
    return { success: false, error: 'Failed to fetch appointments' }
  }
}

export async function createAppointment(
  data: AppointmentBookingInput
): Promise<ApiResponse<Appointment>> {
  try {
    // Check if the doctor is available at the requested time
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        status: {
          in: ['PAYMENT_PENDING', 'BOOKING_CONFIRMED'],
        },
        OR: [
          {
            AND: [
              { appointmentStartUTC: { lte: data.appointmentStartUTC } },
              { appointmentEndUTC: { gt: data.appointmentStartUTC } },
            ],
          },
          {
            AND: [
              { appointmentStartUTC: { lt: new Date(data.appointmentEndUTC) } },
              { appointmentEndUTC: { gte: new Date(data.appointmentEndUTC) } },
            ],
          },
        ],
      },
    })

    if (existingAppointment) {
      return {
        success: false,
        error: 'Doctor is not available at the requested time',
      }
    }

    // Check if the doctor is on leave on the appointment date
    const appointmentDate = new Date(data.appointmentStartUTC)
    appointmentDate.setHours(0, 0, 0, 0)

    const endOfDay = new Date(appointmentDate)
    endOfDay.setHours(23, 59, 59, 999)

    const doctorLeave = await prisma.doctorLeave.findFirst({
      where: {
        doctorId: data.doctorId,
        leaveDate: {
          gte: appointmentDate,
          lte: endOfDay,
        },
      },
    })

    if (doctorLeave) {
      return {
        success: false,
        error: 'Doctor is on leave on the requested date',
      }
    }

    // Set reservation expiration time
    const appSettings = await getAppSettings()
    if (!appSettings.success || !appSettings.data) {
      return { success: false, error: 'Failed to get app settings' }
    }

    const reservationExpiresAt = new Date()
    reservationExpiresAt.setMinutes(
      reservationExpiresAt.getMinutes() +
        appSettings.data.slotReservationDuration
    )

    const appointment = await prisma.appointment.create({
      data: {
        ...data,
        reservationExpiresAt,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
      },
    })

    return { success: true, data: appointment as Appointment }
  } catch (error) {
    console.error('Error creating appointment:', error)
    return { success: false, error: 'Failed to create appointment' }
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: Appointment['status']
): Promise<ApiResponse<Appointment>> {
  try {
    const updatedAppointment = await prisma.appointment.update({
      where: { appointmentId: id },
      data: { status },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
      },
    })

    return { success: true, data: updatedAppointment as Appointment }
  } catch (error) {
    console.error('Error updating appointment status:', error)
    return { success: false, error: 'Failed to update appointment status' }
  }
}

export async function cancelAppointment(
  id: string
): Promise<ApiResponse<Appointment>> {
  try {
    const updatedAppointment = await prisma.appointment.update({
      where: { appointmentId: id },
      data: { status: 'CANCELLED' },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
      },
    })

    return { success: true, data: updatedAppointment as Appointment }
  } catch (error) {
    console.error('Error cancelling appointment:', error)
    return { success: false, error: 'Failed to cancel appointment' }
  }
}

// Doctor availability queries
export async function getDoctorAvailability(
  doctorId: string,
  date: Date
): Promise<ApiResponse<DoctorAvailability>> {
  try {
    // Get the start and end of the day
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Check if it's a working day
    const dayOfWeek = date.getDay()
    const workingDay = await prisma.workingDay.findUnique({
      where: { dayOfWeek },
    })

    if (!workingDay || !workingDay.isWorkingDay) {
      return { success: false, error: 'Not a working day' }
    }

    // Get app settings
    const appSettings = await getAppSettings()
    if (!appSettings.success || !appSettings.data) {
      return { success: false, error: 'Failed to get app settings' }
    }

    // Check if doctor is on leave on this date
    const doctorLeave = await prisma.doctorLeave.findFirst({
      where: {
        doctorId,
        leaveDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    if (doctorLeave) {
      return {
        success: true,
        data: {
          doctorId,
          availableSlots: [],
          unavailableDates: [date],
        },
      }
    }

    // Get existing appointments for the doctor on this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: {
          in: ['PAYMENT_PENDING', 'BOOKING_CONFIRMED'],
        },
        appointmentStartUTC: {
          gte: new Date(startOfDay),
          lte: new Date(endOfDay),
        },
      },
      select: {
        appointmentStartUTC: true,
        appointmentEndUTC: true,
      },
    })

    // Generate available slots
    const { startTime, endTime, slotsPerHour } = appSettings.data
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    const slotDuration = 60 / slotsPerHour // in minutes

    const availableSlots: AppointmentSlot[] = []
    const unavailableDates: Date[] = []

    // Generate all possible slots for the day
    const currentSlotStart = new Date(date)
    currentSlotStart.setHours(startHour, startMinute, 0, 0)

    const lastSlotStart = new Date(date)
    lastSlotStart.setHours(endHour, endMinute - slotDuration, 0, 0)

    while (currentSlotStart <= lastSlotStart) {
      const slotEnd = new Date(currentSlotStart)
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration)

      // Check if this slot conflicts with any existing appointment
      const isAvailable = !existingAppointments.some((appointment) => {
        return (
          (currentSlotStart >= appointment.appointmentStartUTC &&
            currentSlotStart < appointment.appointmentEndUTC) ||
          (slotEnd > appointment.appointmentStartUTC &&
            slotEnd <= appointment.appointmentEndUTC) ||
          (currentSlotStart <= appointment.appointmentStartUTC &&
            slotEnd >= appointment.appointmentEndUTC)
        )
      })

      availableSlots.push({
        start: new Date(currentSlotStart),
        end: slotEnd,
        isAvailable,
        doctorId,
      })

      currentSlotStart.setMinutes(currentSlotStart.getMinutes() + slotDuration)
    }

    const result: DoctorAvailability = {
      doctorId,
      availableSlots,
      unavailableDates,
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching doctor availability:', error)
    return { success: false, error: 'Failed to fetch doctor availability' }
  }
}

export async function getDoctorLeaves(
  doctorId: string
): Promise<ApiResponse<DoctorLeave[]>> {
  try {
    const leaves = await prisma.doctorLeave.findMany({
      where: { doctorId },
      orderBy: { leaveDate: 'asc' },
    })

    return { success: true, data: leaves as DoctorLeave[] }
  } catch (error) {
    console.error('Error fetching doctor leaves:', error)
    return { success: false, error: 'Failed to fetch doctor leaves' }
  }
}

export async function addDoctorLeave(
  doctorId: string,
  leaveDate: Date,
  leaveType: DoctorLeave['leaveType'],
  reason?: string
): Promise<ApiResponse<DoctorLeave>> {
  try {
    const leave = await prisma.doctorLeave.create({
      data: {
        doctorId,
        leaveDate,
        leaveType,
        reason,
      },
    })

    return { success: true, data: leave as DoctorLeave }
  } catch (error) {
    console.error('Error adding doctor leave:', error)
    return { success: false, error: 'Failed to add doctor leave' }
  }
}

export async function removeDoctorLeave(
  leaveId: string
): Promise<ApiResponse<DoctorLeave>> {
  try {
    const leave = await prisma.doctorLeave.delete({
      where: { leaveId },
    })

    return { success: true, data: leave as DoctorLeave }
  } catch (error) {
    console.error('Error removing doctor leave:', error)
    return { success: false, error: 'Failed to remove doctor leave' }
  }
}

// Department related queries
export async function getAllDepartments(): Promise<ApiResponse<Department[]>> {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    })

    return { success: true, data: departments as Department[] }
  } catch (error) {
    console.error('Error fetching departments:', error)
    return { success: false, error: 'Failed to fetch departments' }
  }
}

export async function getDepartmentById(
  id: string
): Promise<ApiResponse<Department>> {
  try {
    const department = await prisma.department.findUnique({
      where: { id },
    })

    if (!department) {
      return { success: false, error: 'Department not found' }
    }

    return { success: true, data: department as Department }
  } catch (error) {
    console.error('Error fetching department:', error)
    return { success: false, error: 'Failed to fetch department' }
  }
}

// FAQ related queries
export async function getAllFAQs(): Promise<ApiResponse<FAQ[]>> {
  try {
    const faqs = await prisma.fAQ.findMany({
      orderBy: { order: 'asc' },
    })

    return { success: true, data: faqs as FAQ[] }
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    return { success: false, error: 'Failed to fetch FAQs' }
  }
}

export async function getFAQById(id: string): Promise<ApiResponse<FAQ>> {
  try {
    const faq = await prisma.fAQ.findUnique({
      where: { id },
    })

    if (!faq) {
      return { success: false, error: 'FAQ not found' }
    }

    return { success: true, data: faq as FAQ }
  } catch (error) {
    console.error('Error fetching FAQ:', error)
    return { success: false, error: 'Failed to fetch FAQ' }
  }
}

// Testimonial related queries
export async function getDoctorTestimonials(
  doctorId: string,
  featuredOnly: boolean = false
): Promise<ApiResponse<DoctorTestimonial[]>> {
  try {
    let whereClause: any = {
      doctorId,
      isPending: false,
    }

    if (featuredOnly) {
      whereClause.isFeatured = true
    }

    const testimonials = await prisma.doctorTestimonial.findMany({
      where: whereClause,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: testimonials as DoctorTestimonial[] }
  } catch (error) {
    console.error('Error fetching doctor testimonials:', error)
    return { success: false, error: 'Failed to fetch doctor testimonials' }
  }
}

export async function createTestimonial(
  appointmentId: string,
  testimonialText: string,
  rating?: number
): Promise<ApiResponse<DoctorTestimonial>> {
  try {
    // Get the appointment details
    const appointment = await prisma.appointment.findUnique({
      where: { appointmentId: appointmentId },
      select: {
        doctorId: true,
        userId: true,
        status: true,
      },
    })

    if (!appointment) {
      return { success: false, error: 'Appointment not found' }
    }

    if (appointment.status !== 'COMPLETED') {
      return {
        success: false,
        error: 'Cannot create testimonial for an incomplete appointment',
      }
    }

    if (!appointment.userId) {
      return {
        success: false,
        error: 'Cannot create testimonial for a guest appointment',
      }
    }

    // Check if a testimonial already exists for this appointment
    const existingTestimonial = await prisma.doctorTestimonial.findUnique({
      where: { appointmentId },
    })

    if (existingTestimonial) {
      return {
        success: false,
        error: 'Testimonial already exists for this appointment',
      }
    }

    const testimonial = await prisma.doctorTestimonial.create({
      data: {
        appointmentId,
        doctorId: appointment.doctorId,
        patientId: appointment.userId,
        testimonialText,
        rating,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
      },
    })

    return { success: true, data: testimonial as DoctorTestimonial }
  } catch (error) {
    console.error('Error creating testimonial:', error)
    return { success: false, error: 'Failed to create testimonial' }
  }
}

// Payment related queries
export async function getOrderById(orderId: string) {
  try {
    // console.log('orderId', { orderId })
    if (!orderId) throw Error('not orderId found!')
    const { unstable_noStore } = await import('next/cache')
    unstable_noStore()
    const data = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
      include: {
        paymentDetails: {
          include: {
            User: true,
          },
        },

        // user: { select: { name: true, phoneNumber: true, role: true } },
      },
    })

    return data
  } catch (error) {
    console.error(error)
    // unstable_noStore not available, continue without it
  }
}

export async function createOrder(
  appointmentId: string,
  doctorId: string,
  amount: number
  // currency: string
): Promise<ApiResponse<Order & { paymentDetails: PaymentDetails }>> {
  // console.log({ appointmentId })
  // console.log({ doctorId })
  // console.log({ amount })
  try {
    const order = await prisma.order.create({
      data: {
        appointmentId,
        doctorId,
        amount,
        // currency,
      },
      include: {
        paymentDetails: true,
      },
    })
    // console.log('order from create order', order)

    return {
      success: true,
      data: order as Order & { paymentDetails: PaymentDetails },
    }
  } catch (error) {
    console.error('Error creating order:', error)
    return { success: false, error: 'Failed to create order' }
  }
}

export async function updateOrderStatus(
  id: string,
  status: Order['paymentStatus']
): Promise<ApiResponse<Order>> {
  try {
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: status,
        paidAt: status === 'Paid' ? new Date() : undefined,
      },
    })

    return { success: true, data: updatedOrder as Order }
  } catch (error) {
    console.error('Error updating order status:', error)
    return { success: false, error: 'Failed to update order status' }
  }
}

export async function getPaymentDetailsByOrderId(
  orderId: string
): Promise<ApiResponse<PaymentDetails>> {
  try {
    const paymentDetails = await prisma.paymentDetails.findUnique({
      where: { orderId },
    })

    if (!paymentDetails) {
      return { success: false, error: 'Payment details not found' }
    }

    return { success: true, data: paymentDetails as PaymentDetails }
  } catch (error) {
    console.error('Error fetching payment details:', error)
    return { success: false, error: 'Failed to fetch payment details' }
  }
}

export async function createPaymentDetails(
  orderId: string,
  userId: string,
  status?: string,
  amount?: number,
  Authority?: string,
  transactionId?: string
): Promise<ApiResponse<PaymentDetails>> {
  try {
    const paymentDetails = await prisma.paymentDetails.create({
      data: {
        orderId,
        userId,
        status,
        amount,
        Authority,
        transactionId,
      },
    })

    return { success: true, data: paymentDetails as PaymentDetails }
  } catch (error) {
    console.error('Error creating payment details:', error)
    return { success: false, error: 'Failed to create payment details' }
  }
}

// App settings queries
export async function getAppSettings(): Promise<ApiResponse<AppSettings>> {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: 'global' },
    })

    if (!settings) {
      return { success: false, error: 'App settings not found' }
    }

    return { success: true, data: settings as AppSettings }
  } catch (error) {
    console.error('Error fetching app settings:', error)
    return { success: false, error: 'Failed to fetch app settings' }
  }
}

export async function updateAppSettings(
  settings: Partial<AppSettings>
): Promise<ApiResponse<AppSettings>> {
  try {
    const updatedSettings = await prisma.appSettings.update({
      where: { id: 'global' },
      data: settings,
    })

    return { success: true, data: updatedSettings as AppSettings }
  } catch (error) {
    console.error('Error updating app settings:', error)
    return { success: false, error: 'Failed to update app settings' }
  }
}

// Working days queries
export async function getAllWorkingDays(): Promise<ApiResponse<WorkingDay[]>> {
  try {
    const workingDays = await prisma.workingDay.findMany({
      orderBy: { dayOfWeek: 'asc' },
    })

    return { success: true, data: workingDays as WorkingDay[] }
  } catch (error) {
    console.error('Error fetching working days:', error)
    return { success: false, error: 'Failed to fetch working days' }
  }
}

export async function updateWorkingDay(
  dayOfWeek: number,
  isWorkingDay: boolean
): Promise<ApiResponse<WorkingDay>> {
  try {
    const workingDay = await prisma.workingDay.upsert({
      where: { dayOfWeek },
      update: { isWorkingDay },
      create: { dayOfWeek, isWorkingDay },
    })

    return { success: true, data: workingDay as WorkingDay }
  } catch (error) {
    console.error('Error updating working day:', error)
    return { success: false, error: 'Failed to update working day' }
  }
}

// Dashboard queries
export async function getDoctorDashboard(
  doctorId: string
): Promise<ApiResponse<DoctorDashboard>> {
  try {
    // Get doctor profile
    const profileResult = await getDoctorProfile(doctorId)
    if (!profileResult.success || !profileResult.data) {
      return { success: false, error: 'Failed to get doctor profile' }
    }

    // Get upcoming appointments
    const now = new Date()
    const upcomingAppointmentsResult = await getAppointmentsByDoctorId(
      doctorId,
      {
        startDate: now,
        limit: 10,
      }
    )

    if (
      !upcomingAppointmentsResult.success ||
      !upcomingAppointmentsResult.data
    ) {
      return { success: false, error: 'Failed to get upcoming appointments' }
    }

    // Get past appointments
    const pastAppointmentsResult = await getAppointmentsByDoctorId(doctorId, {
      endDate: now,
      limit: 10,
    })

    if (!pastAppointmentsResult.success || !pastAppointmentsResult.data) {
      return { success: false, error: 'Failed to get past appointments' }
    }

    // Get total patients (unique users who had appointments with this doctor)
    const totalPatients = await prisma.appointment.count({
      where: {
        doctorId,
        userId: { not: null },
      },
      //   distinct: ['userId'],
    })

    // Get total revenue
    const orders = await prisma.order.findMany({
      where: {
        doctorId,
        paymentStatus: 'Paid',
      },
      select: {
        amount: true,
      },
    })

    const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0)

    // Get doctor leaves
    const leavesResult = await getDoctorLeaves(doctorId)
    if (!leavesResult.success) {
      return { success: false, error: 'Failed to get doctor leaves' }
    }

    const dashboard: DoctorDashboard = {
      profile: profileResult.data,
      upcomingAppointments: upcomingAppointmentsResult.data.data,
      pastAppointments: pastAppointmentsResult.data.data,
      totalPatients,
      totalRevenue,
      averageRating: profileResult.data.doctorProfile.rating,
      reviewCount: profileResult.data.doctorProfile.reviewCount,
      leaves: leavesResult.data || [],
    }

    return { success: true, data: dashboard }
  } catch (error) {
    console.error('Error fetching doctor dashboard:', error)
    return { success: false, error: 'Failed to fetch doctor dashboard' }
  }
}

export async function getPatientDashboard(
  userId: string
): Promise<ApiResponse<PatientDashboard>> {
  try {
    // Get user profile
    const profileResult = await getUserById(userId)
    if (!profileResult.success || !profileResult.data) {
      return { success: false, error: 'Failed to get user profile' }
    }

    // Get upcoming appointments
    const now = new Date()
    const upcomingAppointmentsResult = await getAppointmentsByUserId(userId, {
      startDate: now,
      limit: 10,
    })

    if (
      !upcomingAppointmentsResult.success ||
      !upcomingAppointmentsResult.data
    ) {
      return { success: false, error: 'Failed to get upcoming appointments' }
    }

    // Get past appointments
    const pastAppointmentsResult = await getAppointmentsByUserId(userId, {
      endDate: now,
      limit: 10,
    })

    if (!pastAppointmentsResult.success || !pastAppointmentsResult.data) {
      return { success: false, error: 'Failed to get past appointments' }
    }

    // Get favorite doctors (doctors with most appointments)
    const favoriteDoctors = await prisma.appointment.groupBy({
      by: ['doctorId'],
      where: {
        userId,
        status: 'COMPLETED',
      },
      _count: {
        doctorId: true,
      },
      orderBy: {
        _count: {
          doctorId: 'desc',
        },
      },
      take: 5,
    })

    const favoriteDoctorIds = favoriteDoctors.map((item) => item.doctorId)
    const favoriteDoctorsData = await prisma.user.findMany({
      where: {
        id: { in: favoriteDoctorIds },
        role: 'doctor',
      },
      include: {
        doctorProfile: true,
      },
    })

    const favoriteDoctorsWithProfile = favoriteDoctorsData.map((doctor) => {
      const { doctorProfile, ...userProfile } = doctor
      return {
        ...userProfile,
        doctorProfile,
      } as unknown as DoctorWithProfile
    })

    const dashboard: PatientDashboard = {
      profile: profileResult.data,
      upcomingAppointments: upcomingAppointmentsResult.data.data,
      pastAppointments: pastAppointmentsResult.data.data,
      favoriteDoctors: favoriteDoctorsWithProfile,
    }

    return { success: true, data: dashboard }
  } catch (error) {
    console.error('Error fetching patient dashboard:', error)
    return { success: false, error: 'Failed to fetch patient dashboard' }
  }
}

export async function getAdminDashboard(): Promise<
  ApiResponse<AdminDashboard>
> {
  try {
    // Get total doctors
    const totalDoctors = await prisma.user.count({
      where: { role: 'doctor' },
    })

    // Get total patients
    const totalPatients = await prisma.user.count({
      where: { role: 'user' },
    })

    // Get total appointments
    const totalAppointments = await prisma.appointment.count()

    // Get total revenue
    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: 'Paid',
      },
      select: {
        amount: true,
      },
    })

    const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0)

    // Get recent appointments
    const recentAppointmentsResult = await prisma.appointment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
      },
    })

    // Get top doctors (by rating)
    const topDoctorsData = await prisma.user.findMany({
      where: { role: 'doctor' },
      include: {
        doctorProfile: true,
      },
      orderBy: {
        doctorProfile: {
          rating: 'desc',
        },
      },
      take: 5,
    })

    const topDoctors = topDoctorsData.map((doctor) => {
      const { doctorProfile, ...userProfile } = doctor
      return {
        ...userProfile,
        doctorProfile,
      } as unknown as DoctorWithProfile
    })

    const dashboard: AdminDashboard = {
      totalDoctors,
      totalPatients,
      totalAppointments,
      totalRevenue,
      recentAppointments: recentAppointmentsResult as Appointment[],
      topDoctors,
    }

    return { success: true, data: dashboard }
  } catch (error) {
    console.error('Error fetching admin dashboard:', error)
    return { success: false, error: 'Failed to fetch admin dashboard' }
  }
}

export async function getUserDetails(): Promise<ApiResponse<PatientProfile>> {
  try {
    // 1. Get the current user session
    const session = await currentUser()

    if (!session?.id) {
      return {
        success: false,
        message: 'User not authenticated',
        error: 'Unauthorized: No user session found.',
        errorType: 'AUTHENTICATION',
      }
    }

    const userId = session.id

    // 2. Fetch the user from the database
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    })

    if (!user) {
      return {
        success: false,
        message: 'User Profile not found',
        error: `User not found.: ${session.id}`,
        errorType: 'notFound',
      }
    }

    // 3. Map the database user model to the PatientProfile type
    const patientProfile: PatientProfile = {
      id: user.id,
      name: user.name || '',
      email: user.email,
      phoneNumber: user.phoneNumber ?? undefined,
      address: user.address ?? undefined,
      // Convert DateTime to ISO string, or return undefined if null
      dateOfBirth: user.dateOfBirth?.toISOString().split('T')[0] ?? undefined,
      image: user.image ?? undefined,
    }

    // 4. Return a successful response with the user data
    return {
      success: true,
      message: 'User details fetched successfully.',
      data: patientProfile,
    }
  } catch (error) {
    // 5. Handle unexpected errors
    console.error('Error in getUserDetails server action:', error)
    return {
      success: false,
      message: 'Failed to load profile due to erver error',
      error: error instanceof Error ? error.message : 'unkown error',
      errorType: 'SERVER_ERROR',
    }
  }
}

interface UserAppointmentsData {
  appointments: Appointment[]
  totalAppointments: number
  totalPages: number
  currentPage: number
}

const mapAppointmentStatus = (
  status: AppointmentStatus
): Appointment['status'] | null => {
  switch (status) {
    case AppointmentStatus.BOOKING_CONFIRMED:
      return 'BOOKING_CONFIRMED'
    case AppointmentStatus.COMPLETED:
      return 'COMPLETED'
    case AppointmentStatus.CANCELLED:
      return 'CANCELLED'
    case AppointmentStatus.NO_SHOW:
      return 'NO_SHOW'
    case AppointmentStatus.CASH:
      return 'CASH'
    default:
      // Return null for statuses we don't want to display, like PAYMENT_PENDING
      return null
  }
}
export async function getUserAppointments(params?: {
  page?: number
  limit?: number
}): Promise<ApiResponse<UserAppointmentsData>> {
  try {
    // 1. Authenticate the user
    const session = await currentUser()
    if (!session?.id) {
      return {
        success: false,
        message: 'User not authenticated',
        error: 'Unauthorized: No user session found.',
        errorType: 'AUTHENTICATION',
      }
    }
    const userId = session.id

    // 2. Set up pagination parameters
    const page = params?.page || 1
    const limit = params?.limit || 10
    const skip = (page - 1) * limit

    // 3. Define the common where clause to exclude pending payments
    const whereClause = {
      userId: userId,
      status: {
        not: AppointmentStatus.PAYMENT_PENDING,
      },
    }

    // 4. Get the total count of appointments for the user
    const totalAppointments = await prisma.appointment.count({
      where: whereClause,
    })

    if (totalAppointments === 0) {
      return {
        success: true,
        data: {
          appointments: [],
          totalAppointments: 0,
          totalPages: 0,
          currentPage: 1,
        },
      }
    }

    // 5. Fetch the paginated appointments from the database
    const appointmentsFromDb = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        doctor: {
          select: {
            name: true,
            id: true,
            doctorProfile: {
              select: {
                specialty: true,
              },
            },
          },
        },
        testimonial: {
          select: {
            testimonialId: true,
          },
        },
      },
      orderBy: {
        appointmentStartUTC: 'desc', // Show most recent first
      },
      skip: skip,
      take: limit,
    })

    // 6. Get the application timezone
    const timeZone = getAppTimeZone()

    // 7. Map database results to the required 'Appointment' interface
    const formattedAppointments: Appointment[] = appointmentsFromDb.map(
      (appt) => {
        const mappedStatus = mapAppointmentStatus(appt.status)
        if (!mappedStatus) {
          // This should ideally not happen due to the where clause, but it's a good safeguard.
          throw new Error(`Unhandled appointment status: ${appt.status}`)
        }

        // Convert UTC date to the application's timezone
        const zonedTime = toZonedTime(appt.appointmentStartUTC, timeZone)

        return {
          appointmentId: appt.appointmentId!,
          doctorName: appt.doctor.name,
          doctorId: appt.doctorId,
          specialty: appt.doctor.doctorProfile?.specialty ?? 'General',
          date: format(zonedTime, 'MMMM d, yyyy', { timeZone }),
          time: format(zonedTime, 'hh:mm a', { timeZone }),
          status: mappedStatus,
          reasonForVisit: appt.reasonForVisit ?? undefined,
          isReviewed: !!appt.testimonial, // Check if a testimonial exists
        }
      }
    )

    // 8. Calculate total pages and return the successful response
    const totalPages = Math.ceil(totalAppointments / limit)

    return {
      success: true,
      data: {
        appointments: formattedAppointments,
        totalAppointments,
        totalPages,
        currentPage: page,
      },
    }
  } catch (error) {
    console.error('Error in getUserAppointments server action:', error)
    return {
      success: false,
      message:
        'Failed to fetch appointments due to a server error. Pls try again later',
      error: error instanceof Error ? error.message : 'unkown databse error',
      errorType: 'SERVER_ERROR',
    }
  }
}

export type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: {
    doctor: {
      include: {
        doctorProfile: true
        images: { select: { url: true }; take: 1 }
      }
    }
  }
}>

export async function getAppointmentData({
  appointmentId,
}: {
  appointmentId: string
}): Promise<ApiResponse<AppointmentWithRelations>> {
  // 1. Basic input validation
  if (!appointmentId) {
    return {
      success: false,
      message: 'Appointment identifier is missing',
      error: 'Appointment ID is required.',
      errorType: 'BAD_REQUEST',
    }
  }

  try {
    // 2. Fetch the appointment with its relations
    const appointment = await prisma.appointment.findUnique({
      where: {
        appointmentId: appointmentId,
      },
      include: {
        doctor: {
          include: {
            // Assuming 'doctorProfile' is the name of the relation on the User model
            doctorProfile: true,
            images: { select: { url: true }, take: 1 },
          },
        },
      },
    })

    // 3. Handle case where appointment is not found
    if (!appointment) {
      return {
        success: false,
        error: 'Appointment not found.',
        errorType: 'NOT_FOUND',
        message: 'The requested appointment does not exist.',
      }
    }

    // 4. Check if the appointment status is PAYMENT_PENDING
    if (appointment.status !== 'PAYMENT_PENDING') {
      return {
        success: false,
        error: 'Appointment status conflict.',
        errorType: 'StatusConflict',
        message: `This appointment cannot be processed as its status is '${appointment.status}'. Only appointments pending payment can be accessed.`,
      }
    }

    // 5. Check if the reservation has expired
    const now = new Date()
    if (
      appointment.reservationExpiresAt &&
      appointment.reservationExpiresAt < now
    ) {
      // Optionally, you could also trigger the cleanup action here or just inform the user.
      // For now, we just inform the user as requested.
      return {
        success: false,
        error: 'Appointment reservation has expired.',
        errorType: 'ReservationExpired',
        message:
          'Your reserved time slot has expired. Please select a new appointment time.',
      }
    }

    // 6. Success case: Return the appointment data
    return {
      success: true,
      message: 'Appointment data fetched successfully.',
      data: appointment,
    }
  } catch (error) {
    console.error('Error fetching appointment data:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'An unexpected server error occurred.',
      errorType: 'SERVER_ERROR',
      message:
        'We could not retrieve the appointment details. Please try again later.',
    }
  }
}

export async function getConfirmationDetails(
  appointmentId: string
): Promise<ApiResponse<ConfirmationDetailsData>> {
  if (!appointmentId) {
    return {
      success: false,
      message: 'Appointment Id is required to get confirmation details',
      error: 'No appointment Id provided',
      errorType: 'BAD_REQUEST',
    }
  }

  try {
    // 2. Fetch Data from Database
    const appointmentDetails = await prisma.appointment.findUnique({
      where: {
        appointmentId: appointmentId,
      },
      include: {
        // Include the doctor's details and their specialty from the profile
        doctor: {
          select: {
            name: true,
            doctorProfile: {
              select: {
                specialty: true,
              },
            },
          },
        },
        // Include the registered user's email if available
        user: {
          select: {
            email: true,
          },
        },
        // Include the latest completed transaction for this appointment
        Order: {
          where: {
            // status: TransactionStatus.COMPLETED,
            paymentStatus: PaymentStatus.Paid,
          },
          orderBy: {
            // transactionDate: 'desc',
            paidAt: 'desc',
          },
          take: 1,
        },
      },
    })

    // 3. Handle Not Found Case
    if (!appointmentDetails) {
      return {
        success: false,
        error: 'Not Found',
        message: 'Appointment details could not be found.',
        errorType: 'NOT_FOUND',
      }
    }

    // 4. Transform Data
    const latestTransaction =
      appointmentDetails.Order.length > 0 ? appointmentDetails.Order[0] : null

    const data: ConfirmationDetailsData = {
      appointment: {
        id: appointmentDetails.appointmentId,
        status: appointmentDetails.status,
        startDateTime: appointmentDetails.appointmentStartUTC,
        reason: appointmentDetails.reasonForVisit,
        patientName: appointmentDetails.patientName,
        // Use the registered user's email or a placeholder if it's a guest appointment
        patientEmail: appointmentDetails.user?.email ?? 'N/A',
        // Provide a fallback for the phone number
        patientPhone: appointmentDetails.phoneNumber ?? 'N/A',
      },
      doctor: {
        name: appointmentDetails.doctor.name,
        // Provide a fallback for the doctor's specialty
        speciality:
          appointmentDetails.doctor.doctorProfile?.specialty ??
          'General Physician',
      },
      // Map transaction details if a completed transaction exists
      transaction: latestTransaction
        ? {
            // gatewayTransactionId: latestTransaction.gatewayTransactionId,
            gatewayTransactionId: latestTransaction.authority ?? '',

            amount: latestTransaction.amount,
            currency: latestTransaction.currency ?? '',
            // paymentGateway: latestTransaction.paymentGateway,
          }
        : null,
    }

    // 5. Return Success Response
    return {
      success: true,
      data: data,
    }
  } catch (error) {
    // 6. Handle Server/Database Errors
    console.error('Failed to get confirmation details:', error)
    return {
      success: false,
      error: 'Database Error',
      message:
        'An unexpected error occurred while fetching appointment details. Please try again later.',
      errorType: 'SERVER_ERROR',
    }
  }
}
