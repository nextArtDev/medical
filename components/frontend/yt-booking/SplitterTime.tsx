import { Button } from '@/components/ui/button'
import moment from 'moment'

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

  const timeSlots: moment.Moment[] = []

  for (
    let time = moment(startTime);
    time.isSameOrBefore(endTime);
    time.add(range, 'minutes')
  ) {
    timeSlots.push(moment(time))
  }

  return (
    <div dir="ltr" className="">
      <ul className="flex flex-wrap gap-0.5  place-content-center place-items-center md:grid-cols-6 xl:grid-cols-9">
        {timeSlots.map((slot) => (
          <li key={slot.toISOString()} className="space-y-0.5">
            <Button variant={'outline'} size={'sm'} className="w-12">
              {slot.format('HH:mm')}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
