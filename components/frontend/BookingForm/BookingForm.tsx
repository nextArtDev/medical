'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon } from '@radix-ui/react-icons'
import { format } from 'date-fns-jalali'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { faIR } from 'date-fns/locale'
import jalaali from 'jalaali-js'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { TimeField } from '../time-picker/time-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import Books from './Books'

const FormSchema = z.object({
  dob: z.date({
    required_error: 'A date of birth is required.',
  }),
  duration: z.string(),
  type: z.enum(['all', 'mentions', 'none'], {
    required_error: 'You need to select a notification type.',
  }),
  items: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one item.',
  }),
  // items: z.array(z.string()).refine((value) => value.some((item) => item), {
  //   message: 'You have to select at least one item.',
  // }),
  // time: z.string().time();
})

const availabilityOptions = [
  { label: 'هفتگی', value: 'weekly' },
  { label: 'روزهای خاص', value: 'specific' },
]
const items = [
  {
    id: 'recents',
    label: 'Recents',
  },
  {
    id: 'home',
    label: 'Home',
  },
  {
    id: 'applications',
    label: 'Applications',
  },
  {
    id: 'desktop',
    label: 'Desktop',
  },
  {
    id: 'downloads',
    label: 'Downloads',
  },
  {
    id: 'documents',
    label: 'Documents',
  },
] as const

export default function BookingForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    // toast({
    //   title: 'You submitted the following values:',
    //   description: (
    //     <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
    //       <code className="text-white">{JSON.stringify(data, null, 2)}</code>
    //     </pre>
    //   ),
    // })
    console.log(data)
    console.log(jalaali.toJalaali(data.dob))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Books />
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>بازه زمانی</FormLabel>
              <FormControl>
                <Input placeholder="15" {...field} />
              </FormControl>
              <FormDescription>
                بازه زمانی بین هر نوبت را مشخص کنید.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className=" space-y-3">
              <FormLabel>زمانهایی که برای رزرو نوبت در دسترس هستید</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex gap-4 space-y-1"
                >
                  {availabilityOptions.map((options) => (
                    <FormItem
                      key={options.value}
                      className="flex items-center space-x-3 space-y-0"
                    >
                      <FormControl>
                        <RadioGroupItem value={options.value} />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {options.label}
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <h2>نوبتهای هفتگی را مشخص کنید.</h2>
          <div className="border py-6 px-4 border-gray-200 flex items-center justify-between">
            <div>
              <Checkbox
              // checked={field.value?.includes(item.id)}
              // onCheckedChange={(checked) => {
              //   return checked
              //     ? field.onChange([...field.value, item.id])
              //     : field.onChange(
              //         field.value?.filter((value) => value !== item.id)
              //       )
              // }}
              />
              {/* <FormField
                control={form.control}
                name="items"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Sidebar</FormLabel>
                      <FormDescription>
                        Select the items you want to display in the sidebar.
                      </FormDescription>
                    </div>
                    {items.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="items"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...field.value,
                                          item.id,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {item.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
              {/* <div>
                <Button size={'sm'} className="flex gap-1">
                  <Plus /> اضافه کردن
                </Button>
              </div> */}
              <FormField
                control={form.control}
                name="items"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Sidebar</FormLabel>
                      <FormDescription>
                        Select the items you want to display in the sidebar.
                      </FormDescription>
                    </div>
                    {items.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="items"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger id="sd">
                                    <SelectValue placeholder="sd" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {items.map((item) => (
                                    <SelectItem
                                      key={item.id}
                                      value={item.label}
                                    >
                                      {item.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormLabel className="text-sm font-normal">
                                {item.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        {/* <TimeField
                            size="sm"
                            value={field.value!}
                            onChange={field.onChange}
                          /> */}
        <FormField
          control={form.control}
          name="dob"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of birth</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-[240px] pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        // format(field.value, '')
                        new Intl.DateTimeFormat('fa-IR').format(field.value)
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date <= new Date() || date < new Date('1900-01-01')
                    }
                    locale={faIR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Your date of birth is used to calculate your age.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
