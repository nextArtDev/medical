import DoctorProfileTopCard from './components/doctorprofile-topcard'
import { notFound } from 'next/navigation'
import DoctorProfileAbout from './components/about'
import PatientReviews from './components/patient-reviews'

import AppointmentScheduler from './components/schedule-appointment'
import { currentUser } from '@/lib/auth-helpers'
import { cleanupExpiredReservations } from '../../doctors/[doctorId]/lib/actions'
import { trpc, HydrateClient } from '@/trpc/server'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { appRouter } from '@/trpc/routers/_app'
import { createCallerFactory, createTRPCContext } from '@/trpc/init'

interface Params {
  doctorId: string
}

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<Params>
}) {
  const doctorIdObject = await params
  const { doctorId } = doctorIdObject

  // Prefetch doctor profile to dehydrate state for client
  void trpc.doctors.getById.prefetch({ id: doctorId })

  await cleanupExpiredReservations()

  // Create caller for direct server-side access
  // We use createCallerFactory with appRouter, effectively simulating a server-side call
  const createCaller = createCallerFactory(appRouter)
  const ctx = await createTRPCContext()
  const caller = createCaller(ctx)

  let doctor
  try {
    // Fetch directly to pass data to RSC components and check 404
    doctor = await caller.doctors.getById({ id: doctorId })
  } catch (error) {
    console.error('Error fetching doctor details:', error)
  }

  if (!doctor) {
    notFound()
  }

  const user = await currentUser()
  const userId = user?.id ? user.id : undefined
  const userRole = user?.role ? user.role : undefined

  return (
    <HydrateClient>
      <div className="w-full flex flex-col md:flex-row max-w-[1376px] mx-auto gap-8 p-6 md:p-8">
        <div className="flex flex-col gap-6 md:gap-8 md:max-w-[908px] md:flex-1">
          <DoctorProfileTopCard
            name={doctor.name}
            credentials={doctor.doctorProfile.credentials}
            specialty={doctor.doctorProfile.specialty}
            specializations={doctor.doctorProfile.specializations}
            rating={doctor.doctorProfile.rating}
            reviewCount={doctor.doctorProfile.reviewCount}
            images={doctor.doctorProfile.images || [{ url: '/images/9.jpg' }]}
            brief={doctor.doctorProfile.brief}
          />
          <div className="md:hidden">
            <Suspense
              fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}
            >
              <AppointmentScheduler
                doctorId={doctor.id}
                userId={userId}
                userRole={userRole}
              />
            </Suspense>
          </div>
          <DoctorProfileAbout
            name={doctor.name}
            brief={doctor.doctorProfile.brief}
          />
          <PatientReviews
            doctorId={doctor.id}
            averageRating={doctor.doctorProfile.rating}
          />
        </div>
        <div className="hidden md:block ">
          <Suspense
            fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}
          >
            <AppointmentScheduler
              doctorId={doctor.id}
              userId={userId}
              userRole={userRole}
            />
          </Suspense>
        </div>
      </div>
    </HydrateClient>
  )
}
