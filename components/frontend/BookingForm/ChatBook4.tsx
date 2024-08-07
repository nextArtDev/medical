'use client'

import { FC } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import React from 'react'
import { TimeField } from '../time-picker/time-field'
import { Plus, TimerIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Time } from '@internationalized/date'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { TimeValue } from 'react-aria'

type DayData = {
  dayName: string

  selected: boolean

  startTime?: TimeValue | string | null // adjust according to your needs

  endTime?: TimeValue | string | null // adjust according to your needs
}

interface ChatBook4Props {}
const FormSchema = z.object({
  days: z.object({
    monday: z.object({
      selected: z.boolean(),
      startTime: z.any().optional(),
      endTime: z.any().optional(),
    }),
    tuesday: z.object({
      selected: z.boolean(),
      startTime: z.any().optional(),
      endTime: z.any().optional(),
    }),
    wednesday: z.object({
      selected: z.boolean(),
      startTime: z.any().optional(),
      endTime: z.any().optional(),
    }),
    thursday: z.object({
      selected: z.boolean(),
      startTime: z.any().optional(),
      endTime: z.any().optional(),
    }),
    friday: z.object({
      selected: z.boolean(),
      startTime: z.any().optional(),
      endTime: z.any().optional(),
    }),
    saturday: z.object({
      selected: z.boolean(),
      startTime: z.any().optional(),
      endTime: z.any().optional(),
    }),
    sunday: z.object({
      selected: z.boolean(),
      startTime: z.any().optional(),
      endTime: z.any().optional(),
    }),
  }),
})

const ChatBook4: FC<ChatBook4Props> = ({}) => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      days: {
        monday: { selected: false, startTime: undefined, endTime: undefined },
        tuesday: { selected: false, startTime: undefined, endTime: undefined },
        wednesday: {
          selected: false,
          startTime: undefined,
          endTime: undefined,
        },
        thursday: { selected: false, startTime: undefined, endTime: undefined },
        friday: { selected: false, startTime: undefined, endTime: undefined },
        saturday: { selected: false, startTime: undefined, endTime: undefined },
        sunday: { selected: false, startTime: undefined, endTime: undefined },
      },
    },
  })
  function onSubmit(data: z.infer<typeof FormSchema>) {
    const days: DayData[] = []

    for (const [day, dayData] of Object.entries(data.days)) {
      if (dayData.selected) {
        days.push({
          dayName: day,
          selected: dayData?.selected,
          startTime:
            `${dayData?.startTime?.hour}:${dayData?.startTime?.minute}` || null,

          endTime:
            `${dayData?.endTime?.hour}:${dayData?.endTime?.minute}` || null,
        })
      }
    }
    //prisma availability model
    // model Availability{

    //     day: enum ['sunday',...]
    //     hours: AvalabilityHourse[]
    //     doctor: doctor[]
    // }
    // model AvalabilityHourse{

    //     time: string
    //     availability: Availibality[]
    // }

    console.log(days)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <section className="border py-6 px-4 border-gray-200 ">
          <ul className="flex flex-col gap-4 ">
            {Object.keys(FormSchema.shape.days.shape).map((day, i) => (
              <article
                key={day}
                className="grid grid-cols-4 h-16 place-items-center place-content-center "
              >
                <div className="col-span-1 ml-auto flex justify-center items-center gap-1 ">
                  <FormField
                    control={form.control}
                    name={
                      `days.${day}.selected` as keyof z.infer<typeof FormSchema>
                    }
                    render={({ field }) => (
                      <FormItem className="flex gap-1 items-center justify-center ">
                        <FormControl>
                          <Checkbox
                            checked={!!field.value}
                            onCheckedChange={(checked) =>
                              field.onChange(checked)
                            }
                          />
                        </FormControl>
                        <FormLabel>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-3 w-full flex gap-2 items-center justify-between ">
                  <div
                    dir="ltr"
                    className="flex items-center justify-center gap-1 order-first"
                  >
                    <FormField
                      control={form.control}
                      name={
                        `days.${day}.startTime` as keyof z.infer<
                          typeof FormSchema
                        >
                      }
                      render={({ field }) => (
                        <FormItem className="flex gap-1 items-center justify-center ">
                          <FormControl>
                            <TimeField
                              defaultValue={new Time(0, 0)}
                              suffix={<TimerIcon />}
                              hourCycle={24}
                              size="sm"
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>از</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div
                    dir="ltr"
                    className="order-last  flex items-center justify-center gap-1"
                  >
                    <FormField
                      control={form.control}
                      name={
                        `days.${day}.endTime` as keyof z.infer<
                          typeof FormSchema
                        >
                      }
                      render={({ field }) => (
                        <FormItem className="flex gap-1 items-center justify-center ">
                          <FormControl>
                            <TimeField
                              defaultValue={new Time(0, 0)}
                              hourCycle={24}
                              suffix={<TimerIcon />}
                              size="sm"
                              value={field.value! || new Time(0, 0)}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>تا</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                {/* <div className="col-span-1">
                  <Button size={'sm'} className="p-0.5 px-1 flex gap-1">
                    <Plus className="w-5 h-5" />
                  </Button>
                </div> */}
              </article>
            ))}
          </ul>
        </section>
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}

export default ChatBook4
