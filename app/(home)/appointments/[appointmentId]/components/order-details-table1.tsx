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
  Order,
  PaymentDetails,
  User,
} from '@/lib/generated/prisma'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { toast } from 'sonner'
import { updateOrderToPaidCOD, zarinpalPayment } from '@/lib/actions/payment'
import { format } from 'date-fns-jalali'
// import OrderPayment from './OrderPayment'

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

// interface OrderDetailsTableProps {
//   order: Order & {
//     paymentDetails: { transactionId: string | null } | null
//   } & {
//     user: { name: string; phoneNumber: string }
//   }
//   // isAdmin: boolean
// }
interface OrderDetailsTableProps {
  order: Order & { paymentDetails: PaymentDetails }
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
  } = order

  const isPaid = paymentStatus === 'Paid'
  const paidAt = parseDate(rawPaidAt)
  const transactionId = paymentDetails?.transactionId
  // Payment action state
  const [actionState, zarinpalPaymentAction, isPending] = useActionState(
    zarinpalPayment.bind(null, `/appointments/order/${id}`, id),
    {
      errors: {},
      payment: {},
    }
  )

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
      {/* <h1 className="text-2xl font-bold mb-6">سفارش {formatId(id)}</h1> */}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-4">
          {/* Payment Status Card */}
          <PaymentStatusCard
            isPaid={isPaid}
            paidAt={paidAt}
            transactionId={transactionId}
          />
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <OrderSummaryCard
            amount={+amount}
            isPending={isPending}
            zarinpalPaymentAction={zarinpalPaymentAction}
            isPaid={isPaid}
            orderId={id}
            paidAt={paidAt}
          />
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
            {/* <OrderPayment orderId={orderId} amount={totalPrice} /> */}
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
