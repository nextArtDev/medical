// import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
// import { useState } from "react";
// import { OnApproveData } from "@paypal/paypal-js";
// import {
//   createPayPalOrder,
//   approvePayPalOrder,
// } from "@/lib/actions/appointment.actions";

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

interface PayPalButtonProps {
  appointmentId: string
  disabled: boolean
  onSuccess: () => void
}

const parseDate = (date: Date | string | null): Date | null => {
  if (!date) return null
  if (date instanceof Date) return date
  if (typeof date === 'string') return new Date(date)
  return null
}

export default function PayPalCheckoutButton({
  appointmentId,
  disabled,
  onSuccess,
}: PayPalButtonProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  // Show toast messages based on URL parameters
  useEffect(() => {
    const status = searchParams?.get('status')
    const errorCode = searchParams?.get('error')
    const hasQueryParams =
      searchParams.has('status') || searchParams.has('error')

    if (status === 'success') {
      toast.success('پرداخت با موفقیت انجام شد', {
        position: 'top-center',
      })
    } else if (status === 'already_paid') {
      toast('سفارش قبلاً پرداخت شده بود')
    } else if (errorCode) {
      const message =
        // errorMessages[errorCode] || 'یک خطای پیش‌بینی نشده رخ داده است.'
        'یک خطای پیش‌بینی نشده رخ داده است.'
      toast.error(message)
    }
    if (hasQueryParams) {
      router.replace(pathname, { scroll: false })
    }
  }, [searchParams, pathname, router])

  const {
    id,
    shippingAddress,
    items: orderitems,
    subTotal: itemsPrice,
    shippingFees: shippingPrice,
    total: totalPrice,
    orderStatus,
    paymentStatus,
    paidAt: rawPaidAt,
    paymentDetails,
  } = order

  if (isPending) {
    return (
      <div className="text-center h-12 flex items-center justify-center my-4 text-muted-foreground">
        Loading Paypal...
      </div>
    )
  }

  if (isRejected) {
    return (
      <div className="text-alert-2 text-center my-4">
        Error Loading PayPal checkout. Please try again
      </div>
    )
  }

  const createOrder = async () => {
    setIsCreatingOrder(true)
    const toastId = toast.loading('Initiating PayPal...')
    try {
      const result = await createPayPalOrder(appointmentId)
      if (result.success && result.data?.orderId) {
        toast.success('Proceeding to PayPal', { id: toastId })
        return result.data.orderId
      }
      toast.error(result.message || 'Failed to create order', { id: toastId })
      //add small delay 100 milli seconds
      await new Promise((resolve) => setTimeout(resolve, 100))
      throw new Error('ORDER_CREATION_FAILED')
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message !== 'ORDER_CREATION_FAILED') {
          toast.error(error.message, { id: toastId })
        }
      } else {
        toast.error('An unexpected error occured. Please try again', {
          id: toastId,
        })
      }
      //add delay
      await new Promise((resolve) => setTimeout(resolve, 100))
      throw error
    } finally {
      setIsCreatingOrder(false)
    }
  }

  const onApprove = async (data: OnApproveData) => {
    setIsApproving(true)
    const toastId = toast.loading('Verifying payment...')
    try {
      const result = await approvePayPalOrder(appointmentId, {
        orderId: data.orderID,
      })
      if (result.success) {
        toast.success('Payment successful ! Redirecting...', { id: toastId })
        onSuccess()
        return
      }
      throw new Error(result.message || 'Payment verification failed')
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message, { id: toastId })
      } else {
        toast.error(
          'An unexpected error occured during paypal approaval. Please try again',
          { id: toastId }
        )
      }
    } finally {
      setIsApproving(false)
    }
  }

  return (
    <div className="relative">
      {isCreatingOrder && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded z-10">
          <div className="text-sm text-gray-600">Creating order...</div>
        </div>
      )}
      {IsApproving && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded z-10">
          <div className="text-sm text-gray-600">Verifying Payment...</div>
        </div>
      )}
      <PayPalButtons
        key={appointmentId}
        createOrder={createOrder}
        onApprove={onApprove}
        disabled={disabled || isCreatingOrder || IsApproving}
        style={{ layout: 'vertical', label: 'pay' }}
        onError={(err) => {
          console.log('Paypal checkout error', err)
        }}
      />
    </div>
  )
}
