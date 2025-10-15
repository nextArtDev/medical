import {
  Appointment,
  AppointmentStatus,
  AppSettings,
  DoctorLeave,
  DoctorTestimonial,
  Order,
  PaymentLock,
  PaymentStatus,
  Prisma,
  WorkingDay,
} from '@/lib/generated/prisma'
import prisma from '@/lib/prisma' // Your Prisma client instance

// ==================== TYPES ====================

export type DoctorWithProfile = Prisma.UserGetPayload<{
  include: {
    doctorProfile: true
  }
}>

export type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: {
    doctor: {
      include: {
        doctorProfile: true
      }
    }
    user: true
    testimonial: true
    Order: {
      include: {
        paymentDetails: true
      }
    }
  }
}>

export type AppointmentSlot = {
  startTime: Date
  endTime: Date
  isAvailable: boolean
  doctorId: string
}

export type DoctorAvailability = {
  doctorId: string
  date: Date
  availableSlots: AppointmentSlot[]
}

export type CreateAppointmentInput = {
  doctorId: string
  userId?: string
  guestIdentifier?: string
  patientType: 'MYSELF' | 'SOMEONE_ELSE'
  patientRelation?: string
  patientName: string
  appointmentStartUTC: Date
  appointmentEndUTC: Date
  phoneNumber?: string
  reasonForVisit?: string
  additionalNotes?: string
  patientDateOfBirth?: Date
  reservationExpiresAt?: Date
  paymentMethod?: string
}

export type UpdateAppointmentStatusInput = {
  appointmentId: string
  status: AppointmentStatus
  paymentResult?: any
  paidAt?: Date
}

// ==================== DOCTOR QUERIES ====================

/**
 * Get all active doctors with their profiles
 */
export async function getAllActiveDoctors(): Promise<DoctorWithProfile[]> {
  return prisma.user.findMany({
    where: {
      role: 'doctor',
      isActive: true,
      banned: false,
      doctorProfile: {
        isActive: true,
      },
    },
    include: {
      doctorProfile: true,
    },
    orderBy: {
      doctorProfile: {
        rating: 'desc',
      },
    },
  })
}

/**
 * Get doctor by ID with profile
 */
export async function getDoctorById(
  doctorId: string
): Promise<DoctorWithProfile | null> {
  return prisma.user.findUnique({
    where: {
      id: doctorId,
      role: 'doctor',
    },
    include: {
      doctorProfile: true,
    },
  })
}

/**
 * Get doctors by specialty
 */
export async function getDoctorsBySpecialty(
  specialty: string
): Promise<DoctorWithProfile[]> {
  return prisma.user.findMany({
    where: {
      role: 'doctor',
      isActive: true,
      banned: false,
      doctorProfile: {
        specialty: {
          contains: specialty,
          mode: 'insensitive',
        },
        isActive: true,
      },
    },
    include: {
      doctorProfile: true,
    },
  })
}

// ==================== APPOINTMENT SETTINGS ====================

/**
 * Get app settings
 */
export async function getAppSettings(): Promise<AppSettings | null> {
  return prisma.appSettings.findUnique({
    where: {
      id: 'global',
    },
  })
}

/**
 * Get working days
 */
export async function getWorkingDays(): Promise<WorkingDay[]> {
  return prisma.workingDay.findMany({
    where: {
      isWorkingDay: true,
    },
    orderBy: {
      dayOfWeek: 'asc',
    },
  })
}

// ==================== DOCTOR LEAVE QUERIES ====================

/**
 * Get doctor leaves for a date range
 */
export async function getDoctorLeaves(
  doctorId: string,
  startDate: Date,
  endDate: Date
): Promise<DoctorLeave[]> {
  return prisma.doctorLeave.findMany({
    where: {
      doctorId,
      leaveDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  })
}

/**
 * Check if doctor is on leave for a specific date
 */
export async function isDoctorOnLeave(
  doctorId: string,
  date: Date
): Promise<boolean> {
  const leave = await prisma.doctorLeave.findFirst({
    where: {
      doctorId,
      leaveDate: date,
    },
  })
  return leave !== null
}

// ==================== APPOINTMENT AVAILABILITY ====================

/**
 * Get booked appointments for a doctor on a specific date
 */
export async function getDoctorAppointmentsForDate(
  doctorId: string,
  date: Date
): Promise<Appointment[]> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return prisma.appointment.findMany({
    where: {
      doctorId,
      appointmentStartUTC: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: ['BOOKING_CONFIRMED', 'PAYMENT_PENDING', 'CASH'],
      },
    },
    orderBy: {
      appointmentStartUTC: 'asc',
    },
  })
}

/**
 * Check if a specific time slot is available
 */
export async function isSlotAvailable(
  doctorId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      status: {
        in: ['BOOKING_CONFIRMED', 'PAYMENT_PENDING', 'CASH'],
      },
      OR: [
        {
          AND: [
            { appointmentStartUTC: { lte: startTime } },
            { appointmentEndUTC: { gt: startTime } },
          ],
        },
        {
          AND: [
            { appointmentStartUTC: { lt: endTime } },
            { appointmentEndUTC: { gte: endTime } },
          ],
        },
        {
          AND: [
            { appointmentStartUTC: { gte: startTime } },
            { appointmentEndUTC: { lte: endTime } },
          ],
        },
      ],
    },
  })

  return conflict === null
}

// ==================== APPOINTMENT CRUD ====================

/**
 * Create a new appointment
 */
export async function createAppointment(
  data: CreateAppointmentInput
): Promise<Appointment> {
  return prisma.appointment.create({
    data: {
      ...data,
      status: 'PAYMENT_PENDING',
    },
  })
}

/**
 * Get appointment by ID with all relations
 */
export async function getAppointmentById(
  appointmentId: string
): Promise<AppointmentWithRelations | null> {
  return prisma.appointment.findUnique({
    where: {
      appointmentId,
    },
    include: {
      doctor: {
        include: {
          doctorProfile: true,
        },
      },
      user: true,
      testimonial: true,
      Order: {
        include: {
          paymentDetails: true,
        },
      },
    },
  })
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  input: UpdateAppointmentStatusInput
): Promise<Appointment> {
  return prisma.appointment.update({
    where: {
      appointmentId: input.appointmentId,
    },
    data: {
      status: input.status,
      paymentResult: input.paymentResult,
      paidAt: input.paidAt,
    },
  })
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(
  appointmentId: string
): Promise<Appointment> {
  return prisma.appointment.update({
    where: {
      appointmentId,
    },
    data: {
      status: 'CANCELLED',
      updatedAt: new Date(),
    },
  })
}

/**
 * Get user appointments
 */
export async function getUserAppointments(
  userId: string,
  includeCompleted: boolean = false
): Promise<AppointmentWithRelations[]> {
  return prisma.appointment.findMany({
    where: {
      userId,
      status: includeCompleted
        ? undefined
        : {
            notIn: ['CANCELLED', 'NO_SHOW'],
          },
    },
    include: {
      doctor: {
        include: {
          doctorProfile: true,
        },
      },
      user: true,
      testimonial: true,
      Order: {
        include: {
          paymentDetails: true,
        },
      },
    },
    orderBy: {
      appointmentStartUTC: 'desc',
    },
  })
}

/**
 * Get upcoming appointments for a doctor
 */
export async function getDoctorUpcomingAppointments(
  doctorId: string
): Promise<AppointmentWithRelations[]> {
  return prisma.appointment.findMany({
    where: {
      doctorId,
      appointmentStartUTC: {
        gte: new Date(),
      },
      status: {
        in: ['BOOKING_CONFIRMED', 'PAYMENT_PENDING', 'CASH'],
      },
    },
    include: {
      doctor: {
        include: {
          doctorProfile: true,
        },
      },
      user: true,
      testimonial: true,
      Order: {
        include: {
          paymentDetails: true,
        },
      },
    },
    orderBy: {
      appointmentStartUTC: 'asc',
    },
  })
}

/**
 * Get past appointments for a doctor
 */
export async function getDoctorPastAppointments(
  doctorId: string,
  limit?: number
): Promise<AppointmentWithRelations[]> {
  return prisma.appointment.findMany({
    where: {
      doctorId,
      appointmentEndUTC: {
        lt: new Date(),
      },
      status: 'COMPLETED',
    },
    include: {
      doctor: {
        include: {
          doctorProfile: true,
        },
      },
      user: true,
      testimonial: true,
      Order: {
        include: {
          paymentDetails: true,
        },
      },
    },
    orderBy: {
      appointmentStartUTC: 'desc',
    },
    take: limit,
  })
}

// ==================== RESERVATION MANAGEMENT ====================

/**
 * Clean up expired reservations
 */
export async function cleanupExpiredReservations(): Promise<number> {
  const result = await prisma.appointment.deleteMany({
    where: {
      status: 'PAYMENT_PENDING',
      reservationExpiresAt: {
        lt: new Date(),
      },
    },
  })
  return result.count
}

/**
 * Update reservation expiry
 */
export async function extendReservation(
  appointmentId: string,
  newExpiryTime: Date
): Promise<Appointment> {
  return prisma.appointment.update({
    where: {
      appointmentId,
    },
    data: {
      reservationExpiresAt: newExpiryTime,
    },
  })
}

// ==================== ORDER/PAYMENT QUERIES ====================

/**
 * Create order for appointment
 */
export async function createOrder(data: {
  appointmentId: string
  doctorId: string
  amount: number
  currency: string
  notes?: string
}): Promise<Order> {
  return prisma.order.create({
    data,
  })
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  return prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      appointment: {
        include: {
          doctor: {
            include: {
              doctorProfile: true,
            },
          },
          user: true,
        },
      },
      paymentDetails: true,
    },
  })
}

/**
 * Update order payment status
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  status: PaymentStatus,
  paidAt?: Date,
  authority?: string
): Promise<Order> {
  return prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      paymentStatus: status,
      paidAt,
      authority,
    },
  })
}

// ==================== TESTIMONIAL QUERIES ====================

/**
 * Create testimonial
 */
export async function createTestimonial(data: {
  appointmentId: string
  doctorId: string
  patientId: string
  testimonialText: string
  rating?: number
}): Promise<DoctorTestimonial> {
  return prisma.doctorTestimonial.create({
    data: {
      ...data,
      isPending: true,
      isFeatured: false,
    },
  })
}

/**
 * Get doctor testimonials
 */
export async function getDoctorTestimonials(
  doctorId: string,
  onlyApproved: boolean = true
): Promise<DoctorTestimonial[]> {
  return prisma.doctorTestimonial.findMany({
    where: {
      doctorId,
      isPending: onlyApproved ? false : undefined,
    },
    include: {
      patient: {
        select: {
          name: true,
          image: true,
        },
      },
      appointment: {
        select: {
          appointmentStartUTC: true,
        },
      },
    },
    orderBy: [
      {
        isFeatured: 'desc',
      },
      {
        createdAt: 'desc',
      },
    ],
  })
}

// ==================== STATISTICS ====================

/**
 * Get doctor statistics
 */
export async function getDoctorStatistics(doctorId: string): Promise<{
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  upcomingAppointments: number
  averageRating: number
  totalReviews: number
}> {
  const [total, completed, cancelled, upcoming, profile] = await Promise.all([
    prisma.appointment.count({ where: { doctorId } }),
    prisma.appointment.count({
      where: { doctorId, status: 'COMPLETED' },
    }),
    prisma.appointment.count({
      where: { doctorId, status: 'CANCELLED' },
    }),
    prisma.appointment.count({
      where: {
        doctorId,
        appointmentStartUTC: { gte: new Date() },
        status: { in: ['BOOKING_CONFIRMED', 'PAYMENT_PENDING', 'CASH'] },
      },
    }),
    prisma.doctorProfile.findUnique({
      where: { userId: doctorId },
      select: { rating: true, reviewCount: true },
    }),
  ])

  return {
    totalAppointments: total,
    completedAppointments: completed,
    cancelledAppointments: cancelled,
    upcomingAppointments: upcoming,
    averageRating: profile?.rating ?? 0,
    totalReviews: profile?.reviewCount ?? 0,
  }
}

/**
 * Get appointment statistics for date range
 */
export async function getAppointmentStatistics(
  startDate: Date,
  endDate: Date
): Promise<{
  total: number
  confirmed: number
  pending: number
  cancelled: number
  completed: number
}> {
  const [total, confirmed, pending, cancelled, completed] = await Promise.all([
    prisma.appointment.count({
      where: {
        appointmentStartUTC: { gte: startDate, lte: endDate },
      },
    }),
    prisma.appointment.count({
      where: {
        appointmentStartUTC: { gte: startDate, lte: endDate },
        status: 'BOOKING_CONFIRMED',
      },
    }),
    prisma.appointment.count({
      where: {
        appointmentStartUTC: { gte: startDate, lte: endDate },
        status: 'PAYMENT_PENDING',
      },
    }),
    prisma.appointment.count({
      where: {
        appointmentStartUTC: { gte: startDate, lte: endDate },
        status: 'CANCELLED',
      },
    }),
    prisma.appointment.count({
      where: {
        appointmentStartUTC: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
    }),
  ])

  return { total, confirmed, pending, cancelled, completed }
}

// ==================== PAYMENT LOCK QUERIES ====================

/**
 * Create payment lock
 */
export async function createPaymentLock(
  orderId: string,
  authority: string,
  expiresAt: Date
): Promise<PaymentLock> {
  return prisma.paymentLock.create({
    data: {
      orderId,
      authority,
      expiresAt,
    },
  })
}

/**
 * Get payment lock
 */
export async function getPaymentLock(
  orderId: string
): Promise<PaymentLock | null> {
  return prisma.paymentLock.findUnique({
    where: {
      orderId,
    },
  })
}

/**
 * Delete payment lock
 */
export async function deletePaymentLock(orderId: string): Promise<void> {
  await prisma.paymentLock.delete({
    where: {
      orderId,
    },
  })
}

/**
 * Clean up expired payment locks
 */
export async function cleanupExpiredPaymentLocks(): Promise<number> {
  const result = await prisma.paymentLock.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })
  return result.count
}
