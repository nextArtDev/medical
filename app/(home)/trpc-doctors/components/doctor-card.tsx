import { TransitionLink } from '@/components/home/shared/TransitionLink'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

type Props = {
  doctorName: string
  doctorSpecializations: string[]
  doctorImages: string[]
  doctorSlug: string
}

const DoctorCard = ({
  doctorName,
  doctorSpecializations,
  doctorImages,
  doctorSlug,
}: Props) => {
  return (
    <div className="relative w-full h-full">
      <TransitionLink
        href={`/trpc-doctors/${doctorSlug}`}
        className="flex flex-col border-none  bg-transparent gap-4 rounded-t-xl rounded-b-4xl overflow-hidden" /* Switched to flex-col for consistent height; moved gap here */
      >
        {!!doctorImages && (
          <figure className="relative w-full aspect-square bg-gradient-to-br from-blue-400 via-white to-blue-300   border-none">
            {' '}
            {/* Fixed aspect-square for uniform image height */}
            <Image
              unoptimized
              src={
                // item.images.map((img) => img.url)[0] ||
                '/images/9.jpg'
              }
              fill
              alt={doctorName!}
              className={cn(
                'object-cover mix-blend-multiply rounded-xl overflow-hidden'
              )}
            />
          </figure>
        )}
        <article className="absolute bottom-0 w-full h-1/3 bg-primary/20 backdrop-blur-xl rounded-t-xl rounded-b-4xl flex  py-3 px-3 text-pretty text-xs md:text-sm lg:text-base">
          <div className="pt-2 flex flex-col gap-0.5">
            <p className="font-bold">{doctorName}</p>

            <div className="flex flex-wrap gap-0.5">
              {doctorSpecializations.map((sp, i) => (
                <p className="font-semibold opacity-60 flex gap-1">
                  {sp}
                  <Separator
                    orientation="vertical"
                    className={cn(
                      'opacity-60',
                      i === doctorSpecializations.length - 1 && 'hidden'
                    )}
                  />
                </p>
              ))}
            </div>
          </div>
          <div className="absolute bottom-1 left-1 flex items-center justify-center size-12 rounded-full bg-gradient-to-bl from-white via-blue-900/70 to-white">
            <span className="rotate-45 p-0.5">
              <ArrowLeft className="text-white" />
            </span>
          </div>
        </article>
      </TransitionLink>
    </div>
  )
}

export default DoctorCard
