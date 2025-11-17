import {
  AppointmentStatus,
  Department,
  LeaveType,
  Role,
} from '@/lib/generated/prisma'
import z from 'zod'
import {
  addAdminFormSchema,
  editAdminFormSchema,
  addDepartmentSchema,
  editDepartmentSchema,
  addDoctorFormSchema,
  editDoctorFormSchema,
} from './schemas'

export interface AdminAppointment {
  id: string
  formattedId: string
  doctorId: string
  doctorName: string
  patientName: string
  bookedByName: string | null
  bookedByEmail: string | null
  appointmentDate: string // Formatted Date (e.g., "May 01, 2025")
  appointmentTime: string // Formatted Time (e.g., "10:00 AM")
  status: AppointmentStatus
  phoneNumber?: string | null // Alternate phone from appointment
  userPhoneNumber?: string | null // Primary phone from user table
}

interface RevenueDataPoint {
  name: string
  Revenue: number
}

interface DepartmentRevenueDataPoint {
  name: string
  value: number
  color: string
}

export interface AdminTransaction {
  id: string
  transactionDate: Date
  amount: number
  appointment: {
    appointmentStartUTC: Date
    patientName: string
    status: AppointmentStatus
    doctor: {
      name: string
      doctorProfile: {
        specialty: string
      } | null
    }
  }
}

export interface AdminDashboardData {
  totalRevenue: number
  totalAppointments: number
  revenueAnalyticsData: RevenueDataPoint[]
  departmentRevenueData: DepartmentRevenueDataPoint[]
  transactions: AdminTransaction[]
}

export interface AdminAppointmentsData {
  appointments: AdminAppointment[]
  totalAppointments: number
  totalPages: number
  currentPage: number
}

export interface AdminAppointment {
  id: string
  formattedId: string
  doctorId: string
  doctorName: string
  patientName: string
  bookedByName: string | null
  bookedByEmail: string | null
  appointmentDate: string // Formatted Date (e.g., "May 01, 2025")
  appointmentTime: string // Formatted Time (e.g., "10:00 AM")
  status: AppointmentStatus
  phoneNumber?: string | null // Alternate phone from appointment
  userPhoneNumber?: string | null // Primary phone from user table
}

export interface AdminUserData {
  id: string
  name: string | null
  email: string
  role: Role
  isRootAdmin: boolean | null
}

export type AddAdminFormValues = z.infer<typeof addAdminFormSchema>
export type EditAdminFormValues = z.infer<typeof editAdminFormSchema>
export type AddDepartmentFormValues = z.infer<typeof addDepartmentSchema>
export type EditDepartmentFormValues = z.infer<typeof editDepartmentSchema>

export type AddDoctorFormValues = z.infer<typeof addDoctorFormSchema>

export interface AdminDoctorData {
  id: string
  name: string | null
  email: string
  credentials: string | null // From DoctorProfile
  image: string | null
  specialty: string | null // From DoctorProfile
  isActive: boolean | null // From DoctorProfile
  // languages: string[] | null //From DoctorProfile
  specializations: string[] | null // From DoctorProfile
  brief: string | null // From DoctorProfile
}
export type EditDoctorFormValues = z.infer<typeof editDoctorFormSchema>

export interface InitialLeave {
  date: string
  type: LeaveType
}

export interface AppointmentDetailForLeave {
  id: string // appointmentId
  time: string
  patientName: string | null
  bookedByName?: string | null // Name of user who booked
  phoneNumber: string | null
  email: string | null
  status: AppointmentStatus
}

export interface AdminDoctorDataSimple {
  id: string
  name: string | null
}
export type SelectedAppointmentInfo = {
  appointmentId: string
  appointmentStartUTC: Date
  patientName: string | null
  phoneNumber: string | null
  status: AppointmentStatus
  user: {
    email: string | null
    phoneNumber: string | null
    name: string | null
  } | null
}

export interface DepartmentData extends Department {}
