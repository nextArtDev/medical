'use client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { FC } from 'react'
import { SplitterTime } from './SplitterTime'

const weekDays = [
  {
    id: '1',
    label: 'شنبه',
    component: <SplitterTime />,
  },
  { id: '2', label: 'یکشنبه', component: <SplitterTime /> },
  { id: '3', label: 'دوشنبه', component: <SplitterTime /> },
  { id: '4', label: 'سه‌شنبه', component: <SplitterTime /> },
  { id: '5', label: 'چهارشنبه', component: <SplitterTime /> },
  { id: '6', label: 'پنجشنبه', component: <SplitterTime /> },
  { id: '7', label: 'جمعه', component: <SplitterTime /> },
]
interface AvailabilityProps {}

const Availability: FC<AvailabilityProps> = ({}) => {
  return (
    <div>
      <Tabs dir="rtl" defaultValue="account" className=" ">
        <TabsList className="flex w-full flex-wrap gap-4">
          {weekDays.map((weekDay) => (
            <TabsTrigger
              className="bg-red-500/20"
              key={weekDay.id}
              value={weekDay.label}
            >
              {weekDay.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {weekDays.map((weekDay) => (
          <TabsContent key={weekDay.id} value={weekDay.label}>
            <Card>
              <CardHeader>
                <CardTitle>{weekDay.label}</CardTitle>
                <CardDescription>
                  Make changes to your account here. Click save when
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 ">
                  {weekDay.component}
                  <div className=" border-r p-2">Selected</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default Availability
