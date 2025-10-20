import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import OrderDetailsTable from './components/order-details-table1'

import { Order, PaymentDetails, User } from '@/lib/generated/prisma'
import { Suspense } from 'react'
import { OrderDetailsSkeleton } from './components/Skeletons'
import { getOrderById } from '@/lib/queries/home'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const metadata: Metadata = {
  title: 'جزئیات سفارش',
}

function OrderDetailsTableWrapper({
  order,
  isAdmin,
}: {
  order: Order & {
    paymentDetails: (PaymentDetails & { user: User }) | null
  } & {}

  isAdmin: boolean
}) {
  return (
    <OrderDetailsTable
      order={{
        ...order,
        user: {
          name: order?.paymentDetails?.user.name || '',
          phoneNumber: order?.paymentDetails?.user.phoneNumber ?? '',
        },
      }}
      isAdmin={isAdmin}
    />
  )
}

const OrderDetailsPage = async ({
  params,
}: {
  params: Promise<{ orderId: string }>
}) => {
  const productId = (await params).orderId
  const order = await getOrderById(productId)

  if (!order) notFound()

  return (
    <section>
      <Suspense fallback={<OrderDetailsSkeleton />}>
        <OrderDetailsTableWrapper
          order={{
            ...order,
            paymentDetails: order.paymentDetails
              ? {
                  ...order.paymentDetails,
                  user:
                    (order.paymentDetails as any).user ??
                    (order.paymentDetails as any).User,
                }
              : null,
          }}
          isAdmin={false}
        />
      </Suspense>
    </section>
  )
}

export default OrderDetailsPage
