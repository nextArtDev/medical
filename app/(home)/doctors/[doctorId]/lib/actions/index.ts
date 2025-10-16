'use server'

import { AppointmentStatus } from '@/lib/generated/prisma'
import prisma from '@/lib/prisma'
import { FieldErrors } from 'react-hook-form'

interface ServerActionResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  errorType?: string
  fieldErrors?: FieldErrors
}

export async function cleanupExpiredReservations(): Promise<ServerActionResponse> {
  try {
    const now = new Date()

    // Use deleteMany to efficiently remove all matching records
    const result = await prisma.appointment.deleteMany({
      where: {
        status: AppointmentStatus.PAYMENT_PENDING,
        reservationExpiresAt: {
          lt: now, // 'lt' means "less than"
        },
      },
    })

    console.log(
      `[Server Action] Cleaned up ${result.count} expired reservations.`
    )

    return {
      success: true,
      message: `${result.count} expired reservations were successfully deleted.`,
    }
  } catch (error) {
    console.error('Error cleaning up expired reservations:', error)
    return {
      success: false,
      message: 'Failed to cleanup expired reservations',
      error: 'An unexpected error occurred while cleaning up reservations.',
      errorType: 'SERVER_ERROR',
    }
  }
}
