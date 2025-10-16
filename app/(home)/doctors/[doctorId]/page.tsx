import { currentUser } from '@/lib/auth'
import DoctorProfileTopCard from './components/doctorprofile-topcard'
import { notFound } from 'next/navigation'
import AppointmentScheduler from './components/schedule-appointment'
import DoctorProfileAbout from './components/about'
import PatientReviews from './components/patient-reviews'
import { getDoctorProfile } from '@/lib/queries/home'
import { cleanupExpiredReservations } from './lib/actions'

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

  await cleanupExpiredReservations()

  let doctorActionResponse
  try {
    doctorActionResponse = await getDoctorProfile(doctorId)
  } catch (error) {
    console.error('Error fetching doctor details:', error)
    return (
      <div className="p-6 text-center text-red-500">
        <p>
          We&apos;re sorry , but something went wrong while trying to load the
          doctor&apos;s profile.
        </p>
        <p>Please try refreshing the page or check back later</p>
      </div>
    )
  }

  if (!doctorActionResponse.success) {
    if (doctorActionResponse.errorType === 'NOT_FOUND') {
      notFound()
    }
    //handle all other defined errors
    console.error(
      `failed to fetch doctor details for ${doctorId} `,
      doctorActionResponse.message,
      doctorActionResponse.error
    )
    ;<div className="p-6 text-center text-red-500">
      <p>Could not load doctor profile.</p>
      <p>Please try again later</p>
    </div>
  }

  //happy path
  const doctor = doctorActionResponse.data
  if (!doctor) {
    notFound()
  }

  const user = await currentUser()
  const userId = user?.id ? user.id : undefined
  const userRole = user?.role ? user.role : undefined

  return (
    <div className="w-full flex flex-col md:flex-row max-w-[1376px] mx-auto gap-8 p-6 md:p-8">
      <div className="flex flex-col gap-6 md:gap-8 md:max-w-[908px] md:flex-1">
        <DoctorProfileTopCard
          //   id={doctor.id}
          user={doctor.doctorProfile.user}
          credentials={doctor.doctorProfile.credentials}
          specialty={doctor.doctorProfile.specialty}
          specializations={doctor.doctorProfile.specializations}
          rating={doctor.doctorProfile.rating}
          reviewCount={doctor.doctorProfile.reviewCount}
          images={doctor.doctorProfile.images}
          brief={doctor.doctorProfile.brief}
        />
        <div className="md:hidden">
          <AppointmentScheduler
            doctorId={doctor.id}
            userId={userId}
            userRole={userRole}
          />
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
        <AppointmentScheduler
          doctorId={doctor.id}
          userId={userId}
          userRole={userRole}
        />
      </div>
    </div>
  )
}
