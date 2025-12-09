import { Suspense } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DoctorProfile, Image, User } from '@/lib/generated/prisma'
import DoctorCard from './doctor-card'

interface DoctorGridProps {
  doctors: (DoctorProfile & { doctor: User } & { images: Image[] })[]
  loading?: boolean
  isInSearchPage?: boolean
}

export default function DoctorGrid({
  doctors,
  loading = false,
  isInSearchPage = true,
}: DoctorGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i} className="rounded-none">
            <CardContent className="p-4">
              <Skeleton className="w-full h-48 mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-6 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (doctors.length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent className="py-12 text-center">
          <div className="text-lg font-medium mb-2">لیست دکترها خالی است!</div>
          {isInSearchPage && (
            <div className="text-muted-foreground">
              'هنوز دکتری اضافه نشده است.'
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5">
      {doctors.map((doctor) => (
        <Suspense key={doctor.doctor.id} fallback={<DoctorCardSkeleton />}>
          <DoctorCard
            doctorImages={doctor?.images?.map((img) => img.url) || []}
            doctorName={doctor.doctor.name || ''}
            doctorSpecializations={doctor.specializations || []}
            doctorSlug={doctor.doctor.id || ''}
          />
        </Suspense>
      ))}
    </div>
  )
}

function DoctorCardSkeleton() {
  return (
    <Card className="rounded-none">
      <CardContent className="p-4">
        <Skeleton className="w-full h-48 mb-4" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-6 w-1/3" />
      </CardContent>
    </Card>
  )
}
