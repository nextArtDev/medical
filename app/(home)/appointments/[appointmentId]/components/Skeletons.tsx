// components/skeletons/order-details-skeleton.tsx

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Main Order Details Skeleton
export function OrderDetailsSkeleton() {
  return (
    <div className="container mx-auto py-4">
      {/* Header skeleton */}
      <Skeleton className="h-8 w-64 mb-6" />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-4">
          <PaymentStatusSkeleton />
          <ShippingAddressSkeleton />
          <OrderItemsSkeleton />
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <OrderSummarySkeleton />
        </div>
      </div>
    </div>
  )
}

// Payment Status Card Skeleton
export function PaymentStatusSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-6 w-24" />
      </CardContent>
    </Card>
  )
}

// Shipping Address Card Skeleton
export function ShippingAddressSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-6 w-24 mb-4" />
        <Skeleton className="h-4 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-4" />
        <Skeleton className="h-6 w-20" />
      </CardContent>
    </Card>
  )
}

// Order Items Card Skeleton
export function OrderItemsSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-6 w-20 mb-4" />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-12" />
                </TableHead>
                <TableHead className="text-right">
                  <Skeleton className="h-4 w-12 ml-auto" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center">
                      <Skeleton className="h-12 w-12 rounded-md" />
                      <Skeleton className="h-4 w-32 ml-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// Order Summary Card Skeleton
export function OrderSummarySkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <Skeleton className="h-6 w-32 mb-4" />

        {/* Summary rows */}
        <div className="space-y-3">
          <SummaryRowSkeleton />
          <SummaryRowSkeleton />
          <SummaryRowSkeleton />
        </div>

        <hr className="my-4" />

        {/* Total row */}
        <SummaryRowSkeleton isTotal />

        {/* Payment button */}
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  )
}

// Summary Row Skeleton
function SummaryRowSkeleton({ isTotal = false }: { isTotal?: boolean }) {
  return (
    <div className="flex justify-between">
      <Skeleton className={`h-4 ${isTotal ? 'w-16' : 'w-20'}`} />
      <Skeleton className={`h-4 ${isTotal ? 'w-20' : 'w-16'}`} />
    </div>
  )
}

// Compact version for smaller loading states
export function CompactOrderSkeleton() {
  return (
    <div className="container mx-auto py-4">
      <Skeleton className="h-8 w-64 mb-6" />
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
