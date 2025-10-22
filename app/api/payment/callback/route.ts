import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { zarinpalPaymentApproval } from '@/lib/actions/payment'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const Authority = searchParams.get('Authority')
  const Status = searchParams.get('Status')
  const orderId = searchParams.get('orderId')
  const appointmentId = searchParams.get('appointmentId')
  try {
    // Validate required parameters
    if (!Authority || !Status || !appointmentId || !orderId) {
      return NextResponse.redirect(
        new URL(
          `/appointments/${appointmentId}/${orderId}?error=invalid_params`,
          request.url
        )
      )
    }

    // Get current user
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.redirect(
        new URL('/login?error=unauthorized', request.url)
      )
    }

    // Process payment approval
    const result = await zarinpalPaymentApproval(
      `/appointments/${appointmentId}/${orderId}`,
      orderId,
      Authority,
      appointmentId || '',
      Status
    )

    // Handle different results
    if (result?.errors?._form) {
      const errorMessage = encodeURIComponent(result.errors._form[0])
      return NextResponse.redirect(
        new URL(
          `/appointments/${appointmentId}/${orderId}?error=${errorMessage}`,
          request.url
        )
      )
    }

    if (result?.success) {
      if (result.alreadyPaid) {
        return NextResponse.redirect(
          new URL(
            `/appointments/${appointmentId}/${orderId}?status=already_paid`,
            request.url
          )
        )
      }
      return NextResponse.redirect(
        new URL(
          `/appointments/${appointmentId}/${orderId}?status=success`,
          request.url
        )
      )
    }

    // Default case - redirect with generic error
    return NextResponse.redirect(
      new URL(
        `/appointments/${appointmentId}?error=payment_failed`,
        request.url
      )
    )
  } catch (error) {
    console.error('Payment callback error:', error)
    return NextResponse.redirect(
      new URL(
        `/appointments/${appointmentId}/${orderId}?error=server_error`,
        request.url
      )
    )
  }
}
