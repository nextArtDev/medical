import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import OrderDetailsTable from '../components/order-details-table1'

import { Order, PaymentDetails } from '@/lib/generated/prisma'
import { Suspense } from 'react'
import { OrderDetailsSkeleton } from '../components/Skeletons'
import {
  createOrder,
  getAppointmentById,
  getOrderById,
} from '@/lib/queries/home'
import { User } from '@/lib/auth'
import { currentUser } from '@/lib/auth-helpers'
import { Appointment } from '@/types/home'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const metadata: Metadata = {
  title: 'جزئیات سفارش',
}

function OrderDetailsTableWrapper({
  order,
  appointment,
}: // isAdmin,
{
  order: Order & { paymentDetails: PaymentDetails }
  appointment: Appointment

  // isAdmin: boolean
}) {
  return <OrderDetailsTable order={order} appointment={appointment} />
}

const OrderDetailsPage = async ({
  params,
}: {
  params: Promise<{ appointmentId: string; orderId: string }>
}) => {
  const appointmentId = (await params).appointmentId
  const orderId = (await params).orderId
  const appointment = await getAppointmentById(appointmentId)
  if (!appointment.data?.doctorId) notFound()

  const user = currentUser()

  const order = await getOrderById(orderId)
  // console.log(order.data?.paymentDetails)
  // if (!order.data || !order.success) notFound()

  return (
    <section>
      <Suspense fallback={<OrderDetailsSkeleton />}>
        <OrderDetailsTableWrapper
          order={{
            ...(order as Order),
            paymentDetails: order?.paymentDetails ?? ({} as PaymentDetails),
          }}
          appointment={appointment.data as Appointment}
        />
      </Suspense>
    </section>
  )
}

export default OrderDetailsPage
