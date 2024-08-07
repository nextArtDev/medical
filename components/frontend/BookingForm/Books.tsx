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
  // dob: z.date({
  //   required_error: 'A date of birth is required.',
  // }),
  // duration: z.string(),
  // type: z.enum(
  //   ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'],
  //   {
  //     required_error: 'You need to select a notification type.',
  //   }
  // ),
  type: z.any(),
  // items: z.array(z.string()).refine((value) => value.some((item) => item), {
  //   message: 'You have to select at least one item.',
  // }),
  // items: z.array(z.string()).refine((value) => value.some((item) => item), {
  //   message: 'You have to select at least one item.',
  // }),
  fromTime: z.any(),
  toTime: z.any(),
  // fromTime: z.string().time(),
  // toTime: z.string().time()
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
function Books({}: Props) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    console.log(data.fromTime.hour)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <section className="border py-6 px-4 border-gray-200 flex items-center justify-between">
          <ul className="flex flex-col gap-4 ">
            {weekDays.map((item) => (
              <article
                key={item.id}
                className="grid grid-cols-4 h-16 place-items-center place-content-center "
              >
                <div className="col-span-1 ml-auto flex justify-center items-center gap-1 ">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="flex gap-1 items-center justify-center ">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item.id
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel>{item.label}</FormLabel>
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
                      name="fromTime"
                      render={({ field }) => (
                        <FormItem className="flex gap-1 items-center justify-center ">
                          <FormControl>
                            <TimeField
                              defaultValue={new Time(0, 0)}
                              suffix={<TimerIcon />}
                              hourCycle={24}
                              size="sm"
                              value={field.value!}
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
                      name="toTime"
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

export default Books
