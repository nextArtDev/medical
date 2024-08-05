import { Checkbox } from '@/components/ui/checkbox'
import React from 'react'
import { TimeField } from '../time-picker/time-field'
import { Button } from '@/components/ui/button'
import { Plus, TimerIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Time } from '@internationalized/date'
const weekDays = [
  { id: '1', label: 'شنبه' },
  { id: '2', label: 'یکشنبه' },
  { id: '3', label: 'دوشنبه' },
  { id: '4', label: 'سه‌شنبه' },
  { id: '5', label: 'چهارشنبه' },
  { id: '6', label: 'پنجشنبه' },
  { id: '7', label: 'جمعه' },
]
type Props = {}
function Books({}: Props) {
  return (
    <section className="border py-6 px-4 border-gray-200 flex items-center justify-between">
      <ul className="flex flex-col gap-4 ">
        {weekDays.map((days) => (
          <article
            key={days.id}
            className="grid grid-cols-4 h-16 place-items-center place-content-center "
          >
            <div className="col-span-1 ml-auto flex justify-center items-center gap-1 ">
              <Checkbox
                id={days.id}
                // checked={field.value?.includes(item.id)}
                // onCheckedChange={(checked) => {
                //   return checked
                //     ? field.onChange([...field.value, item.id])
                //     : field.onChange(
                //         field.value?.filter((value) => value !== item.id)
                //       )
                // }}
              />
              <Label htmlFor={days.id}>{days.label}</Label>
            </div>
            <div
              dir="ltr"
              className="col-span-2 flex gap-2 items-center justify-between "
            >
              <TimeField
                defaultValue={new Time(11, 45)}
                label="تا"
                hourCycle={24}
                suffix={<TimerIcon />}
                size="sm"
                // defaultValue={08:00}
                // value={field.value!}
                // onChange={field.onChange}
              />
              <TimeField
                defaultValue={new Time(8, 0)}
                label="از"
                suffix={<TimerIcon />}
                hourCycle={24}
                size="sm"

                // value={field.value!}
                // onChange={field.onChange}
              />
            </div>
            <div className="col-span-1">
              <Button size={'sm'} className="p-0.5 px-1 flex gap-1">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </article>
        ))}
      </ul>
    </section>
  )
}

export default Books
