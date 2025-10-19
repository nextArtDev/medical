// Base types for API responses
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  errorType?: string
  message?: string
}

// User related types
export interface UserProfile {
  id: string
  name: string
  email: string
  role: 'user' | 'admin' | 'doctor'
  image: string | null // Changed from string | undefined to string | null
  dateOfBirth: string | Date | null // Changed from Date | undefined to Date | null
  phoneNumber: string | null // Changed from string | undefined to string | null
  address: string | null // Changed from string | undefined to string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DoctorProfile {
  profileId: string
  images: { url: string }[] | null
  userId: string
  user: UserProfile
  specialty: string
  brief: string
  credentials: string
  rating: number
  reviewCount: number
  specializations: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DoctorWithProfile extends UserProfile {
  doctorProfile: DoctorProfile
}

export interface DoctorReview {
  id: string
  rating: number | null
  reviewDate: string
  testimonialText: string
  patientName: string
  patientImage: string | null
}
export interface TimeSlot {
  startTime: string
  endTime: string
  startTimeUTC: Date
  endTimeUTC: Date
}

// Appointment related types
export interface Appointment {
  appointmentId: string
  doctorId: string
  userId: string | null // Changed from string | undefined to string | null
  guestIdentifier: string | null // Changed from string | undefined to string | null
  patientType: 'MYSELF' | 'SOMEONE_ELSE'
  patientRelation: string | null // Changed from string | undefined to string | null
  patientName: string
  paymentMethod: string | null // Changed from string | undefined to string | null
  paymentResult: any | null // Changed from any | undefined to any | null
  paidAt: Date | null // Changed from Date | undefined to Date | null
  appointmentStartUTC: Date
  appointmentEndUTC: Date
  phoneNumber: string | null // Changed from string | undefined to string | null
  reasonForVisit: string | null // Changed from string | undefined to string | null
  additionalNotes: string | null // Changed from string | undefined to string | null
  patientDateOfBirth: Date | null // Changed from Date | undefined to Date | null
  reservationExpiresAt: Date | null // Changed from Date | undefined to Date | null
  status:
    | 'PAYMENT_PENDING'
    | 'BOOKING_CONFIRMED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'NO_SHOW'
    | 'CASH'
  createdAt: Date
  updatedAt: Date
  doctor: UserProfile
  user: UserProfile | null // Changed from UserProfile | undefined to UserProfile | null
}

export interface AppointmentSlot {
  start: Date
  end: Date
  isAvailable: boolean
  doctorId: string
}

export interface AppointmentBookingInput {
  doctorId: string
  userId?: string | null // Allow null for guest appointments
  guestIdentifier?: string | null
  patientType: 'MYSELF' | 'SOMEONE_ELSE'
  patientRelation?: string | null
  patientName: string
  appointmentStartUTC: Date
  appointmentEndUTC: Date
  phoneNumber?: string | null
  reasonForVisit?: string | null
  additionalNotes?: string | null
  patientDateOfBirth?: Date | null
}

// Doctor availability types
export interface DoctorLeave {
  leaveId: string
  doctorId: string
  leaveDate: Date
  leaveType: 'FULL_DAY' | 'MORNING' | 'AFTERNOON'
  reason: string | null // Changed from string | undefined to string | null
  createdAt: Date
}

export interface DoctorAvailability {
  doctorId: string
  availableSlots: AppointmentSlot[]
  unavailableDates: Date[]
}

// Department types
export interface Department {
  id: string
  name: string
  iconName: string
  createdAt: Date
  updatedAt: Date
}

// FAQ types
export interface FAQ {
  id: string
  question: string
  answer: string
  order: number
  createdAt: Date
  updatedAt: Date
}

// Testimonial types
export interface DoctorTestimonial {
  testimonialId: string
  appointmentId: string
  doctorId: string
  patientId: string
  testimonialText: string
  rating: number | null // Changed from number | undefined to number | null
  createdAt: Date
  updatedAt: Date
  isFeatured: boolean
  isPending: boolean
  doctor: UserProfile
  patient: UserProfile
}

// Payment related types
export interface Order {
  id: string
  appointmentId: string
  doctorId: string
  amount: number
  currency: string
  paidAt: Date | null // Changed from Date | undefined to Date | null
  notes: string | null // Changed from string | undefined to string | null
  paymentStatus:
    | 'Pending'
    | 'Paid'
    | 'Failed'
    | 'Declined'
    | 'Cancelled'
    | 'Refunded'
    | 'PartiallyRefunded'
    | 'Chargeback'
  authority: string | null // Changed from string | undefined to string | null
  createdAt: Date
  updatedAt: Date
}

export interface PaymentDetails {
  id: string
  status: string | null // Changed from string | undefined to string | null
  amount: number | null // Changed from number | undefined to number | null
  Authority: string | null // Changed from string | undefined to string | null
  transactionId: string | null // Changed from string | undefined to string | null
  orderId: string
  createdAt: Date
  updatedAt: Date
  userId: string
}

// App settings types
export interface AppSettings {
  id: string
  slotsPerHour: number
  startTime: string
  endTime: string
  slotReservationDuration: number
}

export interface WorkingDay {
  dayId: string
  dayOfWeek: number
  isWorkingDay: boolean
}

// Dashboard types
export interface DoctorDashboard {
  profile: DoctorWithProfile
  upcomingAppointments: Appointment[]
  pastAppointments: Appointment[]
  totalPatients: number
  totalRevenue: number
  averageRating: number
  reviewCount: number
  leaves: DoctorLeave[]
}

export interface PatientDashboard {
  profile: UserProfile
  upcomingAppointments: Appointment[]
  pastAppointments: Appointment[]
  favoriteDoctors: DoctorWithProfile[]
}

export interface AdminDashboard {
  totalDoctors: number
  totalPatients: number
  totalAppointments: number
  totalRevenue: number
  recentAppointments: Appointment[]
  topDoctors: DoctorWithProfile[]
}

// Search and filter types
export interface DoctorSearchFilters {
  specialty?: string
  rating?: number
  availableDate?: Date
  page?: number
  limit?: number
}

export interface AppointmentSearchFilters {
  doctorId?: string
  userId?: string
  status?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}

// Pagination types
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface DoctorReviewsPaginatedData {
  reviews: DoctorReview[]
  totalReviews: number
  totalPages: number
  currentPage: number
}

export interface PatientProfile {
  id: string
  name: string
  email: string
  phoneNumber?: string
  address?: string
  dateOfBirth?: string
  image?: string
}

export interface AppointmentReservationParams {
  doctorId: string
  userId: string
  date: string
  startTime: string
  endTime: string
}

export interface ReservationSuccessData {
  appointmentId: string
}

export interface GuestAppointmentParams {
  doctorId: string
  date: string
  startTime: string
  endTime: string
}

export interface GuestAppointmentSuccessData {
  appointmentId: string
  guestIdentifier: string
}

export interface ReservationSuccessData {
  appointmentId: string
}

export interface AppointmentReservationParams {
  doctorId: string
  userId: string
  date: string
  startTime: string
  endTime: string
}
