'use client'

import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface DaySchedule {
  dayOfWeek: number
  dayName: string
  isWorking: boolean
  startTime: string
  endTime: string
}

interface DoctorScheduleEditorProps {
  schedule: DaySchedule[]
  onChange: (schedule: DaySchedule[]) => void
  disabled?: boolean
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

export default function DoctorScheduleEditor({
  schedule,
  onChange,
  disabled = false,
}: DoctorScheduleEditorProps) {
  const handleToggleDay = (dayOfWeek: number) => {
    const updatedSchedule = schedule.map((day) =>
      day.dayOfWeek === dayOfWeek ? { ...day, isWorking: !day.isWorking } : day
    )
    onChange(updatedSchedule)
  }

  const handleTimeChange = (
    dayOfWeek: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    const updatedSchedule = schedule.map((day) =>
      day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day
    )
    onChange(updatedSchedule)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map((day) => {
          const daySchedule = schedule.find((s) => s.dayOfWeek === day.value)
          if (!daySchedule) return null

          return (
            <div
              key={day.value}
              className="flex items-center gap-4 p-4 border rounded-lg"
            >
              <div className="flex items-center gap-2 w-32">
                <Switch
                  checked={daySchedule.isWorking}
                  onCheckedChange={() => handleToggleDay(day.value)}
                  disabled={disabled}
                />
                <Label className="font-medium">{day.label}</Label>
              </div>

              {daySchedule.isWorking ? (
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`start-${day.value}`} className="text-sm">
                      From:
                    </Label>
                    <Input
                      id={`start-${day.value}`}
                      type="time"
                      value={daySchedule.startTime}
                      onChange={(e) =>
                        handleTimeChange(day.value, 'startTime', e.target.value)
                      }
                      disabled={disabled}
                      className="w-32"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`end-${day.value}`} className="text-sm">
                      To:
                    </Label>
                    <Input
                      id={`end-${day.value}`}
                      type="time"
                      value={daySchedule.endTime}
                      onChange={(e) =>
                        handleTimeChange(day.value, 'endTime', e.target.value)
                      }
                      disabled={disabled}
                      className="w-32"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Not working
                </span>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
