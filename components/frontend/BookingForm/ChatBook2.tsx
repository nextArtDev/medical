'use client'
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

const FormSchema = z.object({
  days: z.array(
    z.object({
      id: z.string(),
      fromTime: z.object({
        hour: z.any(),
        minute: z.any(),
      }),
      toTime: z.object({
        hour: z.any(),
        minute: z.any(),
      }),
    })
  ),
})

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
function ChatBook2({}: Props) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    // defaultValues: {
    //   days: weekDays.map((day) => ({
    //     id: day.id,
    //     fromTime: { hour: 0, minute: 0 },
    //     toTime: { hour: 0, minute: 0 },
    //   })),
    // },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <section className="border py-6 px-4 border-gray-200 ">
          <ul className="flex flex-col gap-4 ">
            {form.watch('days')?.map((day, index) => (
              <article
                key={day.id}
                className="grid grid-cols-4 h-16 place-items-center place-content-center "
              >
                <div className="col-span-1 ml-auto flex justify-center items-center gap-1 ">
                  <FormField
                    control={form.control}
                    name={`days.${index}.id`}
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
                          {weekDays.find((w) => w.id === field.value)?.label}
                        </FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2 w-full flex gap-2 items-center justify-between ">
                  <div
                    dir="ltr"
                    className="flex items-center justify-center gap-1 order-first"
                  >
                    <FormField
                      control={form.control}
                      name={`days.${index}.fromTime`}
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
                      name={`days.${index}.toTime`}
                      render={({ field }) => (
                        <FormItem className="flex gap-1 items-center justify-center ">
                          <FormControl>
                            <TimeField
                              defaultValue={new Time(0, 0)}
                              hourCycle={24}
                              suffix={<TimerIcon />}
                              size="sm"
                              value={field.value!}
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
                <div className="col-span-1">
                  <Button size={'sm'} className="p-0.5 px-1 flex gap-1">
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

export default ChatBook2
