'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import DoctorScheduleEditor, { DaySchedule } from './doctor-scheduale-editor'
import { DoctorScheduleData, updateDoctorSchedule } from '../../../lib/actions'

// import {
//   updateDoctorSchedule,
//   DoctorScheduleData,
// } from '@/lib/actions/schedule'

interface ManageDoctorScheduleClientProps {
  doctor: {
    id: string
    name: string
  }
  initialSchedule: DoctorScheduleData[]
}

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
]

export default function ManageDoctorScheduleClient({
  doctor,
  initialSchedule,
}: ManageDoctorScheduleClientProps) {
  const [isPending, startTransition] = useTransition()
  const [schedule, setSchedule] = useState<DaySchedule[]>([])

  useEffect(() => {
    // Initialize schedule with day names
    const scheduleWithNames = DAYS.map((day) => {
      const existing = initialSchedule.find((s) => s.dayOfWeek === day.value)
      return {
        dayOfWeek: day.value,
        dayName: day.label,
        isWorking: existing?.isWorking ?? true,
        startTime: existing?.startTime || '09:00',
        endTime: existing?.endTime || '17:00',
      }
    })
    setSchedule(scheduleWithNames)
  }, [initialSchedule])

  const handleSubmit = () => {
    // Validate that all working days have valid times
    const invalidDays = schedule.filter(
      (day) =>
        day.isWorking &&
        (!day.startTime || !day.endTime || day.startTime >= day.endTime)
    )

    if (invalidDays.length > 0) {
      toast.error(
        'Please ensure all working days have valid start and end times'
      )
      return
    }

    startTransition(async () => {
      const scheduleData: DoctorScheduleData[] = schedule.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        isWorking: s.isWorking,
        startTime: s.isWorking ? s.startTime : null,
        endTime: s.isWorking ? s.endTime : null,
      }))

      const result = await updateDoctorSchedule(doctor.id, scheduleData)

      if (result.success) {
        toast.success(result.message || 'Schedule updated successfully!')
      } else {
        toast.error(result.message || 'Failed to update schedule')
      }
    })
  }

  return (
    <div
      dir="ltr"
      className="bg-white rounded-xl shadow border border-gray-200 p-6"
    >
      {/* <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                {doctor.name} - Schedule Management
              </h1>
            </div>
          </div> */}
      <DoctorScheduleEditor
        schedule={schedule}
        onChange={setSchedule}
        disabled={isPending}
      />

      <div className="flex justify-end gap-4 mt-6">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Schedule'
          )}
        </Button>
      </div>
    </div>
  )
}
