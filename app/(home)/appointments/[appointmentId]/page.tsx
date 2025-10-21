import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import OrderDetailsTable from './components/order-details-table1'

import { Appointment, Order, PaymentDetails } from '@/lib/generated/prisma'
import { Suspense } from 'react'
import { OrderDetailsSkeleton } from './components/Skeletons'
import {
  createOrder,
  getAppointmentById,
  getOrderById,
} from '@/lib/queries/home'
import { currentUser, User } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const metadata: Metadata = {
  title: 'جزئیات سفارش',
}

function OrderDetailsTableWrapper({
  order,
}: // isAdmin,
{
  order: Order & { paymentDetails: PaymentDetails }

  // isAdmin: boolean
}) {
  return <OrderDetailsTable order={order} />
}

const OrderDetailsPage = async ({
  params,
}: {
  params: Promise<{ appointmentId: string }>
}) => {
  const appointmentId = (await params).appointmentId
  const appointment = await getAppointmentById(appointmentId)
  if (!appointment.data?.doctorId) notFound()
  const user = currentUser()
  // const order = await createOrder(
  //   appointmentId,
  //   appointment.data?.doctorId,
  //   50000 // Fixed amount for appointment
  // )
  // console.log(order)
  // console.log(order.data?.paymentDetails)
  // if (!order.data || !order.success) notFound()

  return (
    <section>
      <Suspense fallback={<OrderDetailsSkeleton />}>
        <OrderDetailsTableWrapper
          order={{
            ...(order.data as Order),
            paymentDetails: order.data.paymentDetails ?? ({} as PaymentDetails),
          }}
        />
      </Suspense>
    </section>
  )
}

export default OrderDetailsPage
