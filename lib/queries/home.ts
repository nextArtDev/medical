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
} from '@/types/home'
import prisma from '../prisma'
import { format, toZonedTime } from 'date-fns-tz'
import { getAppTimeZone } from '../utils'

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

export async function updateUserProfile(
  id: string,
  data: Partial<UserProfile>
): Promise<ApiResponse<UserProfile>> {
  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data,
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

    return { success: true, data: updatedUser as UserProfile }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return { success: false, error: 'Failed to update user profile' }
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
            gte: startOfDay,
            lte: endOfDay,
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
      },
    })

    if (!appointment) {
      return { success: false, error: 'Appointment not found' }
    }

    return { success: true, data: appointment as Appointment }
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
              { appointmentStartUTC: { lt: data.appointmentEndUTC } },
              { appointmentEndUTC: { gte: data.appointmentEndUTC } },
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
          gte: startOfDay,
          lte: endOfDay,
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
export async function getOrderById(id: string): Promise<ApiResponse<Order>> {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    return { success: true, data: order as Order }
  } catch (error) {
    console.error('Error fetching order:', error)
    return { success: false, error: 'Failed to fetch order' }
  }
}

export async function createOrder(
  appointmentId: string,
  doctorId: string,
  amount: number,
  currency: string
): Promise<ApiResponse<Order>> {
  try {
    const order = await prisma.order.create({
      data: {
        appointmentId,
        doctorId,
        amount,
        currency,
      },
    })

    return { success: true, data: order as Order }
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
