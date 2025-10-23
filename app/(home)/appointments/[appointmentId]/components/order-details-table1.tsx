'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'

import { useActionState, useEffect, useMemo, useTransition } from 'react'

import {
  Appointment,
  AppointmentStatus,
  Order,
  PaymentDetails,
  User,
} from '@/lib/generated/prisma'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { toast } from 'sonner'
import { updateOrderToPaidCOD, zarinpalPayment } from '@/lib/actions/payment'
import { format } from 'date-fns-jalali'
import { useQuery } from '@tanstack/react-query'
import { getConfirmationDetails } from '@/lib/queries/home'
import { ApiResponse, ConfirmationDetailsData } from '@/types/home'
import { toZonedTime } from 'date-fns-tz'
import { formatBookingId, getAppTimeZone } from '@/lib/utils'
import { Check, Info } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

// Types
const errorMessages: Record<string, string> = {
  invalid_params: 'اطلاعات تایید پرداخت نامعتبر است.',
  unauthorized: 'شما برای مشاهده این سفارش اجازه دسترسی ندارید.',
  payment_failed: 'فرآیند پرداخت ناموفق بود یا توسط شما لغو شد.',
  server_error: 'خطایی در سرور رخ داده است. لطفا با پشتیبانی تماس بگیرید.',
  verification_failed:
    'تایید پرداخت با خطا مواجه شد. اگر مبلغی از حساب شما کسر شده، طی ۷۲ ساعت آینده باز خواهد گشت.',
  lock_failed:
    'این پرداخت در حال پردازش است. لطفا چند لحظه صبر کرده و صفحه را رفرش کنید.',
}

interface OrderDetailsTableProps {
  order: Order & { paymentDetails: PaymentDetails }
  appointment: Appointment
}

// Helper function to safely parse date
const parseDate = (date: Date | string | null): Date | null => {
  if (!date) return null
  if (date instanceof Date) return date
  if (typeof date === 'string') return new Date(date)
  return null
}

const OrderDetailsTable = ({ order }: OrderDetailsTableProps) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

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
        errorMessages[errorCode] || 'یک خطای پیش‌بینی نشده رخ داده است.'
      toast.error(message)
    }
    if (hasQueryParams) {
      router.replace(pathname, { scroll: false })
    }
  }, [searchParams, pathname, router])

  const {
    id,
    amount,
    paymentStatus,
    paidAt: rawPaidAt,
    paymentDetails,
    appointmentId,
  } = order

  const isPaid = paymentStatus === 'Paid'
  const paidAt = parseDate(rawPaidAt)
  const transactionId = paymentDetails?.transactionId

  // Payment action state
  const [actionState, zarinpalPaymentAction, isPending] = useActionState(
    zarinpalPayment.bind(null, `/appointments/${appointmentId}`, id),
    {
      errors: {},
      payment: {},
    }
  )

  // Get confirmation details only when payment is successful
  const { data: confirmationDetails, isLoading: isConfirmationLoading } =
    useQuery<ApiResponse<ConfirmationDetailsData> | null>({
      queryKey: ['confirmation-details', appointmentId],
      queryFn: async () => {
        // Only fetch confirmation details if payment is successful
        if (!appointmentId || !isPaid) return null
        return await getConfirmationDetails(appointmentId)
      },
      enabled: !!appointmentId && !!isPaid, // Only run if we have appointmentId and payment is successful
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    })

  // Handle payment URL redirect
  useEffect(() => {
    if (actionState.payment?.url) {
      window.location.href = actionState.payment.url
    }
  }, [actionState.payment?.url])

  // Show error messages
  useEffect(() => {
    if (actionState.errors?._form) {
      toast.error(actionState.errors._form[0])
    }
  }, [actionState.errors])

  return (
    <div className="container mx-auto py-4">
      <div className="grid  gap-6">
        {/* Main Content */}
        <div className=" space-y-4">
          {/* Payment Status Card */}
          {/* <PaymentStatusCard
            isPaid={isPaid}
            paidAt={paidAt}
            transactionId={transactionId}
          /> */}

          {/* Confirmation Details Section - Only show when payment is successful and we have confirmation details */}
          {isPaid &&
            confirmationDetails?.success &&
            confirmationDetails.data && (
              <ConfirmationDetailsSection
                confirmationDetails={confirmationDetails.data}
                appointmentId={appointmentId}
              />
            )}
        </div>

        {/* Order Summary Sidebar */}
        {/* <div>
          <OrderSummaryCard
            amount={+amount}
            isPending={isPending}
            zarinpalPaymentAction={zarinpalPaymentAction}
            isPaid={isPaid}
            orderId={id}
            paidAt={paidAt}
          />
        </div> */}
      </div>
    </div>
  )
}

// Extracted confirmation details section into a separate component
const ConfirmationDetailsSection = ({
  confirmationDetails,
  appointmentId,
}: {
  confirmationDetails: ConfirmationDetailsData
  appointmentId: string
}) => {
  const { appointment, doctor, transaction } = confirmationDetails
  const isCashPayment = appointment.status === AppointmentStatus.CASH
  const timeZone = getAppTimeZone()
  // Convert UTC date to the application's timezone
  const zonedTime = toZonedTime(appointment.startDateTime, timeZone)

  return (
    <div className="w-full max-w-[768px] mx-auto  mt-[15px] mb-[15px]">
      {/* Header Section */}
      <div className="text-center pt-8 pb-8">
        <div className="w-16 h-16 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="text-green-600 w-8 h-8" />
        </div>
        <h2 className="text-text-title">
          {isCashPayment ? 'Appointment Confirmed' : 'Payment Successful'}
        </h2>
        <p className="mt-2 body-regular text-text-body-subtle">
          {isCashPayment
            ? 'Please arrive at the counter 30 min before your appointment to make the payment.'
            : 'Your appointment has been confirmed'}
        </p>
      </div>
      <Separator className="bg-border-2" />

      <div className="p-6 space-y-6">
        {/* Booking Details Section (Conditional) */}
        {!isCashPayment && transaction && (
          <div className="p-4 rounded-lg bg-primary-subtle">
            <div className="flex justify-between mb-4 ">
              <div className="body-semibold text-text-title">جزئیات نوبت</div>
              <div className="body-small">{formatBookingId(appointmentId)}</div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="body-small text-text-body-subtle">
                  Payment ID
                </div>
                <div className="body-small text-text-title">
                  {transaction.gatewayTransactionId}
                </div>
              </div>
              <div className="flex justify-between">
                <div className="body-small text-text-body-subtle">
                  میزان پرداخت
                </div>
                <div className="body-small text-text-title">
                  {transaction.amount.toFixed(2)} {transaction.currency}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointment Information Section */}
        <div className="p-4 rounded-lg bg-primary-subtle">
          <div className="body-semibold text-text-title mb-4">اطلاعات نوبت</div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <div className="body-small text-text-body-subtle">زمان</div>
              <div className="body-small text-text-title">
                {`${format(zonedTime, 'MMMM dd, yyyy')} at ${format(
                  zonedTime,
                  'hh:mm a'
                )}`}
              </div>
            </div>
            <div className="flex justify-between">
              <div className="body-small text-text-body-subtle">دکتر</div>
              <div className="body-small text-text-title">{doctor.name}</div>
            </div>
            <div className="flex justify-between">
              <div className="body-small text-text-body-subtle">تخصص</div>
              <div className="body-small text-text-title">
                {doctor.speciality}
              </div>
            </div>
            <div className="flex justify-between">
              <div className="body-small text-text-body-subtle">نوع نوبت</div>
              <div className="body-small text-text-title capitalize">
                {appointment.reason?.replace(/_/g, ' ').toLowerCase() ||
                  'Regular Checkup'}
              </div>
            </div>
          </div>
        </div>

        {/* Patient Details Section */}
        <div className="p-4 rounded-lg bg-primary-subtle">
          <div className="body-semibold text-text-title mb-4">بیمار</div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <div className="body-small text-text-body-subtle">نام</div>
              <div className="body-small text-text-title">
                {appointment.patientName}
              </div>
            </div>
            <div className="flex justify-between">
              <div className="body-small text-text-body-subtle">ایمیل</div>
              <div className="body-small text-text-title">
                {appointment.patientEmail}
              </div>
            </div>
            <div className="flex justify-between">
              <div className="body-small text-text-body-subtle">شماره</div>
              <div className="body-small text-text-title">
                {appointment.patientPhone}
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Instructions Section */}
        <div className="flex p-4 rounded-lg bg-primary-subtle">
          <div className="flex-shrink-0 mt-[3px]">
            <Info className="h-5 w-5 text-blue-500" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <div className=" body-semibold text-alert-1 mb-1">
              Appointment Instructions
            </div>
            <div className="mt-2 body-small text-notice-1">
              <ul className="space-y-1">
                <li>
                  {isCashPayment
                    ? 'Please arrive 30 min before your scheduled time to complete the payment at the counter.'
                    : 'Please arrive 15 minutes before your scheduled time.'}
                </li>
                <li>Bring any relevant medical records or test reports.</li>
                <li>Wear a mask during your visit.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <Button
            variant="outline"
            className="flex-1 text-xs md:text-sm text-text-body font-normal"
            asChild
          >
            <Link href="/user/profile">دیدن نوبت</Link>
          </Button>
          <Button
            className="flex-1 text-xs md:text-sm font-bold text-text-caption-2"
            asChild
          >
            <Link href="/">برگشت به صفحه اصلی</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

const PaymentStatusCard = ({
  isPaid,
  paidAt,
  transactionId,
}: {
  isPaid: boolean
  paidAt: Date | null
  transactionId: string | null | undefined
}) => (
  <Card>
    <CardContent className="p-4 space-y-2">
      <h2 className="text-xl mb-2">وضعیت پرداخت</h2>
      {isPaid ? (
        <div className="space-y-3">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {paidAt
              ? `پرداخت در ${format(paidAt, 'yyyy-MM-dd')}`
              : 'پرداخت شده'}
          </Badge>
          {transactionId && (
            <div className="text-sm text-gray-600">
              <span>شماره پیگیری: </span>
              <span className="font-mono">{transactionId}</span>
            </div>
          )}
        </div>
      ) : (
        <Badge variant="destructive">پرداخت نشده</Badge>
      )}
    </CardContent>
  </Card>
)

const OrderSummaryCard = ({
  amount,
  isPending,
  zarinpalPaymentAction,
  isPaid,
  orderId,
  paidAt,
}: {
  amount: number
  isPending: boolean
  zarinpalPaymentAction: (formData: FormData) => void
  isPaid: boolean
  orderId: string
  paidAt: Date | null
}) => {
  const MarkAsPaidButton = () => {
    const [isPending, startTransition] = useTransition()

    return (
      <Button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await updateOrderToPaidCOD(orderId)
            if (res.success) {
              toast.success(
                typeof res?.message === 'string'
                  ? res.message
                  : 'عملیات با موفقیت انجام شد'
              )
            } else {
              toast.error(
                typeof res?.message === 'string'
                  ? res.message
                  : 'مشکلی پیش آمده، لطفا دوباره امتحان کنید!'
              )
            }
          })
        }
      >
        {isPending ? 'در حال انجام...' : 'تغییر به پرداخت شده'}
      </Button>
    )
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h2 className="text-xl font-bold mb-4">خلاصه سفارش</h2>
        <hr className="my-4" />

        <SummaryRow label="مجموع" value={amount.toString()} isTotal />

        {isPaid && paidAt ? (
          <Badge className="bg-green-500 hover:bg-green-600 w-full justify-center h-12">
            پرداخت شده در {format(paidAt, 'yyyy-MM-dd')}
          </Badge>
        ) : isPaid ? (
          <Badge className="bg-green-500 hover:bg-green-600 w-full justify-center h-12">
            پرداخت شده
          </Badge>
        ) : (
          <div className="flex flex-col gap-4">
            <form action={zarinpalPaymentAction} className="space-y-2">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? 'در حال پردازش...' : 'پرداخت'}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const SummaryRow = ({
  label,
  value,
  isTotal = false,
}: {
  label: string
  value: string
  isTotal?: boolean
}) => (
  <div className={`flex justify-between ${isTotal ? 'font-bold text-lg' : ''}`}>
    <div>{label}</div>
    <div>{value}</div>
  </div>
)

export default OrderDetailsTable
