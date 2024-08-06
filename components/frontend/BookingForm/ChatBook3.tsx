'use client'
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Checkbox } from '@/components/ui/checkbox'
import { TimeField } from '../time-picker/time-field'
import { TimerIcon, Plus } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Time } from '@internationalized/date'
import { Button } from '@/components/ui/button'

const weekDays = [
  { id: '1', label: 'شنبه' },
  { id: '2', label: 'یکشنبه' },
  { id: '3', label: 'دوشنبه' },
  { id: '4', label: 'سه‌شنبه' },
  { id: '5', label: 'چهارشنبه' },
  { id: '6', label: 'پنجشنبه' },
  { id: '7', label: 'جمعه' },
]

// Define Form Schema using Zod
const FormSchema = z.object({
  bookings: z
    .array(
      z.object({
        day: z.any(),
        fromTime: z.any(),
        toTime: z.any(),
      })
    )
    .optional(),
})

function ChatBook3() {
  const form = useForm({
    resolver: zodResolver(FormSchema),
  })

  const onSubmit = (data) => {
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <section className="border py-6 px-4 border-gray-200">
          <ul className="flex flex-col gap-4">
            {weekDays.map((item) => (
              <article
                key={item.id}
                className="grid grid-cols-4 h-16 place-items-center"
              >
                <div className="col-span-1 flex justify-center items-center">
                  <FormField
                    control={form.control}
                    name={`bookings.${item.id}.selected`} // Unique name for each day's selection
                    render={({ field }) => (
                      <FormItem className="flex gap-1 items-center">
                        <FormControl>
                          <Checkbox
                            checked={!!field.value}
                            onCheckedChange={(checked) => {
                              const newValue = checked ? item.id : undefined
                              form.setValue(`bookings.${item.id}`, {
                                day: item.id,
                                fromTime: '',
                                toTime: '',
                              })
                              field.onChange(newValue)
                            }}
                          />
                        </FormControl>
                        <FormLabel>{item.label}</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2 flex gap-2">
                  <FormField
                    control={form.control}
                    name={`bookings.${item.id}.fromTime`}
                    render={({ field }) => (
                      <FormItem className="flex gap-1 items-center">
                        <FormControl>
                          <TimeField
                            defaultValue={new Time(0, 0)}
                            hourCycle={24}
                            suffix={<TimerIcon />}
                            size="sm"
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>از</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`bookings.${item.id}.toTime`}
                    render={({ field }) => (
                      <FormItem className="flex gap-1 items-center">
                        <FormControl>
                          <TimeField
                            defaultValue={new Time(0, 0)}
                            hourCycle={24}
                            suffix={<TimerIcon />}
                            size="sm"
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>تا</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    size="sm"
                    className="p-0.5 px-1 flex gap-1"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </article>
            ))}
          </ul>
        </section>
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}

export default ChatBook3
