'use client'

import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import moment, { Moment } from 'moment'
import { useState } from 'react'

export const SplitterTime = ({
  range = 10,
  start = '08:00',
  end = '13:00',
}: {
  range?: number
  start?: string
  end?: string
}) => {
  const startTime = moment(start, 'HH:mm')
  const endTime = moment(end, 'HH:mm')

  const generateTimeSlots = () => {
    const slots = []

    for (
      let time = moment(startTime);
      time.isSameOrBefore(endTime);
      time.add(range, 'minutes')
    ) {
      slots.push(moment(time))
    }

    return slots
  }

  //   const timeSlots: moment.Moment[] = []

  //   for (
  //     let time = moment(startTime);
  //     time.isSameOrBefore(endTime);
  //     time.add(range, 'minutes')
  //   ) {
  //     timeSlots.push(moment(time))
  //   }
  //   const [selected, setSelected] = useState<Moment[]>([])
  //   const [times, setTimes] = useState(generateTimeSlots())

  const [timeSlots, setTimeSlots] = useState(generateTimeSlots())

  const [removedSlots, setRemovedSlots] = useState<Moment[]>([])

  //   console.log(times)

  const handleSlotClick = (slot: Moment) => {
    setTimeSlots(timeSlots.filter((time) => !time.isSame(slot)))

    setRemovedSlots([...removedSlots, slot])
  }

  const handleSlotRemoveClick = (slot: Moment) => {
    setTimeSlots([...timeSlots, slot])

    setRemovedSlots(removedSlots.filter((time) => !time.isSame(slot)))
  }

  return (
    <div dir="ltr" className="grid grid-cols-1 sm:grid-cols-2">
      <ul className="flex flex-wrap gap-0.5  place-content-center place-items-center md:grid-cols-6 xl:grid-cols-9">
        {timeSlots.map((slot) => (
          <li
            key={slot.toISOString()}
            onClick={() => handleSlotClick(slot)}
            className="space-y-0.5"
          >
            <Button variant={'outline'} size={'sm'} className="relative w-12">
              {slot.format('HH:mm')}
              <span className="absolute  top-0 right-0  text-blue-500 ">
                <Plus className="w-3 h-3" />
              </span>
            </Button>
          </li>
        ))}
      </ul>

      <ul className="flex flex-wrap gap-0.5 border-b sm:border-l sm:border-b-none px-0.5 m-2 place-content-center place-items-center md:grid-cols-6 xl:grid-cols-9">
        {removedSlots.map((slot) => (
          <li
            key={slot.toISOString()}
            onClick={() => handleSlotRemoveClick(slot)}
          >
            <Button size={'sm'} className="relative w-12">
              {slot.format('HH:mm')}
              <span className="absolute  top-0 right-0  text-red-500 ">
                <X className="w-3 h-3" />
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
