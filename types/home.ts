import {
  AppointmentStatus,
  LeaveType,
  PatientType,
  PaymentStatus,
  Prisma,
} from '@/lib/generated/prisma'

// ==================== PRISMA RELATION TYPES ====================

/**
 * User with Doctor Profile
 */
export type DoctorWithProfile = Prisma.UserGetPayload<{
  include: {
    doctorProfile: true
  }
}>

/**
 * User with all relations
 */
export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    doctorProfile: true
    sessions: true
    accounts: true
    doctorAppointments: true
    userAppointments: true
  }
}>

/**
 * Appointment with all relations
 */
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

/**
 * Appointment with basic relations
 */
export type AppointmentWithBasicInfo = Prisma.AppointmentGetPayload<{
  include: {
    doctor: {
      select: {
        id: true
        name: true
        image: true
        doctorProfile: {
          select: {
            specialty: true
            credentials: true
          }
        }
      }
    }
    user: {
      select: {
        id: true
        name: true
        email: true
        phoneNumber: true
      }
    }
  }
}>

/**
 * Order with relations
 */
export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    appointment: {
      include: {
        doctor: {
          include: {
            doctorProfile: true
          }
        }
        user: true
      }
    }
    doctor: {
      include: {
        doctorProfile: true
      }
    }
    paymentDetails: true
  }
}>

/**
 * Testimonial with relations
 */
export type TestimonialWithRelations = Prisma.DoctorTestimonialGetPayload<{
  include: {
    doctor: {
      select: {
        id: true
        name: true
        doctorProfile: {
          select: {
            specialty: true
          }
        }
      }
    }
    patient: {
      select: {
        id: true
        name: true
        image: true
      }
    }
    appointment: {
      select: {
        appointmentStartUTC: true
        appointmentEndUTC: true
      }
    }
  }
}>

/**
 * Doctor Leave with relations
 */
export type DoctorLeaveWithDoctor = Prisma.DoctorLeaveGetPayload<{
  include: {
    doctor: {
      select: {
        id: true
        name: true
      }
    }
  }
}>

/**
 * Payment Details with relations
 */
export type PaymentDetailsWithRelations = Prisma.PaymentDetailsGetPayload<{
  include: {
    order: {
      include: {
        appointment: true
      }
    }
    User: {
      select: {
        id: true
        name: true
        email: true
      }
    }
  }
}>

// ==================== INPUT TYPES ====================

/**
 * Create Appointment Input
 */
export type CreateAppointmentInput = {
  doctorId: string
  userId?: string
  guestIdentifier?: string
  patientType: PatientType
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

/**
 * Update Appointment Input
 */
export type UpdateAppointmentInput = {
  appointmentId: string
  patientName?: string
  phoneNumber?: string
  reasonForVisit?: string
  additionalNotes?: string
  patientDateOfBirth?: Date
}

/**
 * Update Appointment Status Input
 */
export type UpdateAppointmentStatusInput = {
  appointmentId: string
  status: AppointmentStatus
  paymentResult?: any
  paidAt?: Date
}

/**
 * Reschedule Appointment Input
 */
export type RescheduleAppointmentInput = {
  appointmentId: string
  newStartTime: Date
  newEndTime: Date
  reason?: string
}

/**
 * Create Doctor Leave Input
 */
export type CreateDoctorLeaveInput = {
  doctorId: string
  leaveDate: Date
  leaveType: LeaveType
  reason?: string
}

/**
 * Create Order Input
 */
export type CreateOrderInput = {
  appointmentId: string
  doctorId: string
  amount: number
  currency: string
  notes?: string
}

/**
 * Update Order Input
 */
export type UpdateOrderInput = {
  orderId: string
  paymentStatus?: PaymentStatus
  paidAt?: Date
  authority?: string
  notes?: string
}

/**
 * Create Payment Details Input
 */
export type CreatePaymentDetailsInput = {
  orderId: string
  userId: string
  status?: string
  amount?: number
  Authority?: string
  transactionId?: string
}

/**
 * Create Testimonial Input
 */
export type CreateTestimonialInput = {
  appointmentId: string
  doctorId: string
  patientId: string
  testimonialText: string
  rating?: number
}

/**
 * Update Testimonial Input
 */
export type UpdateTestimonialInput = {
  testimonialId: string
  isPending?: boolean
  isFeatured?: boolean
  testimonialText?: string
  rating?: number
}

/**
 * Create Doctor Profile Input
 */
export type CreateDoctorProfileInput = {
  userId: string
  specialty: string
  brief: string
  credentials: string
  specializations: string[]
}

/**
 * Update Doctor Profile Input
 */
export type UpdateDoctorProfileInput = {
  profileId: string
  specialty?: string
  brief?: string
  credentials?: string
  specializations?: string[]
  isActive?: boolean
}

/**
 * Update App Settings Input
 */
export type UpdateAppSettingsInput = {
  slotsPerHour?: number
  startTime?: string
  endTime?: string
  slotReservationDuration?: number
}

// ==================== SEARCH/FILTER TYPES ====================

/**
 * Doctor Search Filters
 */
export type DoctorSearchFilters = {
  specialty?: string
  specializations?: string[]
  minRating?: number
  searchTerm?: string
  isActive?: boolean
  sortBy?: 'rating' | 'reviewCount' | 'name'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Appointment Search Filters
 */
export type AppointmentSearchFilters = {
  doctorId?: string
  userId?: string
  status?: AppointmentStatus | AppointmentStatus[]
  startDate?: Date
  endDate?: Date
  patientName?: string
  phoneNumber?: string
  sortBy?: 'appointmentStartUTC' | 'createdAt' | 'status'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

/**
 * Order Search Filters
 */
export type OrderSearchFilters = {
  doctorId?: string
  userId?: string
  paymentStatus?: PaymentStatus | PaymentStatus[]
  startDate?: Date
  endDate?: Date
  minAmount?: number
  maxAmount?: number
  sortBy?: 'createdAt' | 'amount' | 'paidAt'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// ==================== AVAILABILITY TYPES ====================

/**
 * Time Slot
 */
export type TimeSlot = {
  startTime: Date
  endTime: Date
  isAvailable: boolean
  doctorId: string
  isReserved?: boolean
}

/**
 * Appointment Slot
 */
export type AppointmentSlot = {
  startTime: Date
  endTime: Date
  isAvailable: boolean
  doctorId: string
  reason?: string // Why slot is unavailable (if applicable)
}

/**
 * Doctor Availability
 */
export type DoctorAvailability = {
  doctorId: string
  doctorName: string
  date: Date
  availableSlots: AppointmentSlot[]
  isOnLeave: boolean
  leaveType?: LeaveType
  totalSlots: number
  availableCount: number
}

/**
 * Weekly Availability
 */
export type WeeklyAvailability = {
  doctorId: string
  weekStartDate: Date
  weekEndDate: Date
  dailyAvailability: DoctorAvailability[]
}

/**
 * Slot Availability Check Result
 */
export type SlotAvailabilityResult = {
  isAvailable: boolean
  reason?:
    | 'BOOKED'
    | 'OUTSIDE_HOURS'
    | 'ON_LEAVE'
    | 'NON_WORKING_DAY'
    | 'PAST_DATE'
  conflictingAppointment?: string // Appointment ID if booked
}

// ==================== STATISTICS TYPES ====================

/**
 * Doctor Statistics
 */
export type DoctorStatistics = {
  doctorId: string
  doctorName: string
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  noShowAppointments: number
  upcomingAppointments: number
  averageRating: number
  totalReviews: number
  totalRevenue: number
  pendingPayments: number
}

/**
 * Appointment Statistics
 */
export type AppointmentStatistics = {
  total: number
  confirmed: number
  pending: number
  cancelled: number
  completed: number
  noShow: number
  cashPayments: number
  byStatus: Record<AppointmentStatus, number>
}

/**
 * Revenue Statistics
 */
export type RevenueStatistics = {
  totalRevenue: number
  paidRevenue: number
  pendingRevenue: number
  refundedRevenue: number
  byDoctor: Array<{
    doctorId: string
    doctorName: string
    revenue: number
    appointmentCount: number
  }>
  byMonth: Array<{
    month: string
    revenue: number
    appointmentCount: number
  }>
}

/**
 * Dashboard Statistics
 */
export type DashboardStatistics = {
  appointments: AppointmentStatistics
  revenue: RevenueStatistics
  todayAppointments: number
  upcomingAppointments: number
  activePatients: number
  activeDoctors: number
  recentAppointments: AppointmentWithBasicInfo[]
}

// ==================== PAGINATION TYPES ====================

/**
 * Pagination Parameters
 */
export type PaginationParams = {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Paginated Response
 */
export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
    hasMore: boolean
  }
}

// ==================== RESPONSE TYPES ====================

/**
 * API Success Response
 */
export type ApiSuccessResponse<T = any> = {
  success: true
  data: T
  message?: string
}

/**
 * API Error Response
 */
export type ApiErrorResponse = {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

/**
 * API Response
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

// ==================== PAYMENT TYPES ====================

/**
 * Payment Intent
 */
export type PaymentIntent = {
  orderId: string
  amount: number
  currency: string
  authority?: string
  redirectUrl?: string
}

/**
 * Payment Verification Result
 */
export type PaymentVerificationResult = {
  success: boolean
  orderId: string
  transactionId?: string
  authority?: string
  amount?: number
  status: PaymentStatus
  message?: string
}

/**
 * Payment Lock Info
 */
export type PaymentLockInfo = {
  orderId: string
  authority: string
  isLocked: boolean
  lockedAt?: Date
  expiresAt?: Date
  remainingTime?: number // in seconds
}

/**
 * Payment Attempt Info
 */
export type PaymentAttemptInfo = {
  orderId: string
  authority: string
  status: string
  amount: number
  createdAt: Date
}

// ==================== NOTIFICATION TYPES ====================

/**
 * Notification Type
 */
export type NotificationType =
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_REMINDER'
  | 'APPOINTMENT_RESCHEDULED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'TESTIMONIAL_REQUEST'

/**
 * Notification Data
 */
export type NotificationData = {
  type: NotificationType
  userId: string
  appointmentId?: string
  orderId?: string
  title: string
  message: string
  data?: Record<string, any>
  sentAt: Date
}

// ==================== VALIDATION TYPES ====================

/**
 * Validation Error
 */
export type ValidationError = {
  field: string
  message: string
  code: string
}

/**
 * Validation Result
 */
export type ValidationResult = {
  isValid: boolean
  errors: ValidationError[]
}

// ==================== DATE/TIME TYPES ====================

/**
 * Time Range
 */
export type TimeRange = {
  startTime: string // HH:MM format
  endTime: string // HH:MM format
}

/**
 * Date Range
 */
export type DateRange = {
  startDate: Date
  endDate: Date
}

/**
 * Working Hours
 */
export type WorkingHours = {
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  isWorkingDay: boolean
  startTime?: string // HH:MM format
  endTime?: string // HH:MM format
}

// ==================== CALENDAR TYPES ====================

/**
 * Calendar Event
 */
export type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  doctorId: string
  doctorName: string
  patientName: string
  status: AppointmentStatus
  type: 'APPOINTMENT' | 'LEAVE' | 'BLOCKED'
  color?: string
}

/**
 * Calendar Day View
 */
export type CalendarDayView = {
  date: Date
  events: CalendarEvent[]
  workingHours: TimeRange
  isWorkingDay: boolean
}

// ==================== EXPORT TYPES ====================

/**
 * Export Format
 */
export type ExportFormat = 'CSV' | 'EXCEL' | 'PDF'

/**
 * Export Options
 */
export type ExportOptions = {
  format: ExportFormat
  dateRange?: DateRange
  filters?: Record<string, any>
  columns?: string[]
}

// ==================== UTILITY TYPES ====================

/**
 * Select fields helper
 */
export type SelectFields<T> = {
  [K in keyof T]?: boolean
}

/**
 * Include relations helper
 */
export type IncludeRelations<T> = {
  [K in keyof T]?: boolean | object
}

/**
 * Partial update helper
 */
export type PartialUpdate<T> = {
  [K in keyof T]?: T[K]
}

// ==================== ENUM EXPORTS ====================

export { Prisma }
