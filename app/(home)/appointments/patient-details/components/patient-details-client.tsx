'use client'

import PatientDetailsForm from './patient-details-form'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { format, parseISO } from 'date-fns-jalali'
import Link from 'next/link'
import { AppointmentData, PatientData } from '@/types/home'
import BookingSteps from './booking-steps'

interface PatientDetailsClientProps {
  initialAppointmentData: AppointmentData
  initialPatientDetails: PatientData
}

export default function PatientDetailsClient({
  initialAppointmentData,
  initialPatientDetails,
}: PatientDetailsClientProps) {
  const { doctorName, doctorSpecilaity, doctorImage, date, timeSlot } =
    initialAppointmentData

  // const formattedDate = date ? date: ''
  const formattedDate = date ? format(date, 'd MMMM') : ''
  const formattedTime = timeSlot
    ? format(parseISO(`1970-01-01T${timeSlot}:00`), 'hh:mm a')
    : ''

  return (
    <div className="w-full max-w-[768px] mx-auto bg-background mt-[15px] mb-[15px]">
      {/* Header Section */}
      <div className="flex justify-between items-center p-4 md:p-6">
        <Link
          href={`/doctors/${initialAppointmentData.doctorId}`}
          className="flex items-center"
        >
          <ChevronRight className="w-4 h-4 ml-1" />
          <span className="body-regular">برگشت به صفحه دکتر</span>
        </Link>
        <div className="text-right">
          <div className="body-small text-text-body-subtle">
            نوبت انتخاب شده:
          </div>
          <div className="body-semibold text-text-title">
            {formattedDate} | {formattedTime}
          </div>
        </div>
      </div>

      <div className="h-px bg-border-2"></div>

      <div className="flex items-center gap-4 p-4 md:p-6">
        {/* Doctor Info Section */}
        <div className="relative h-12 w-12 rounded-full overflow-hidden">
          {doctorImage ? (
            <Image
              src={doctorImage}
              alt={`Photo of ${doctorName}`}
              fill
              className="rounded-full object-cover border"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200">
              <span className="text-xl font-semibold text-gray-500">
                {doctorName?.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h3>{doctorName}</h3>
          <p className="body-regular text-text-caption-1">{doctorSpecilaity}</p>
        </div>
      </div>

      <div className="h-px bg-border-2"></div>

      {/* Booking Steps */}
      <div className="p-4">
        <BookingSteps currentStep={2} />
      </div>

      {/* Form Placeholder */}
      <PatientDetailsForm
        appointmentData={initialAppointmentData}
        patientDetails={initialPatientDetails}
      />
    </div>
  )
}
