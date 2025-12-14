'use client'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import Image from 'next/image'
import { useRef } from 'react'

import { useInView } from 'framer-motion'
import Autoplay from 'embla-carousel-autoplay'
import { cn } from '@/lib/utils'
import { TransitionLink } from '../shared/TransitionLink'
import { FadeIn } from '@/components/shared/fade-in'
import { ArrowBigLeft, ArrowLeft } from 'lucide-react'

export type item = {
  id: string
  link: string
  category: string
  title: string
  price: number
  imageSrc: string
}

type DoctorCarousel = {
  //   items: Partial<HomepageProduct>[]
  items: {
    images: { url: string }[] | null
    slug: string
    name: string
    specialization: { name: string }
  }[]
}

export default function DoctorCarousel({ items }: DoctorCarousel) {
  const carouselRef = useRef(null)

  const isInView = useInView(carouselRef, { once: true, amount: 0.3 })
  return (
    <Carousel
      opts={{
        align: 'start',
        direction: 'rtl',
        loop: true,
      }}
      plugins={
        isInView
          ? [
              Autoplay({
                delay: 3000,
              }),
            ]
          : []
      }
      dir="rtl"
      className="w-full"
      ref={carouselRef}
    >
      <CarouselContent className="-ml-1 md:-ml-2 xl:-ml-4">
        {items.map((item, i) => (
          <CarouselItem
            key={item.slug}
            className="pl-1 basis-1/2 md:pl-2 md:basis-1/3 lg:basis-1/4 xl:pl-4 xl:basis-1/5 "
          >
            <FadeIn
              className="translate-y-5 "
              vars={{ delay: 0.2 * i, duration: 0.3, ease: 'sine.inOut' }}
            >
              <TransitionLink
                href={`/trpc-doctors/${item.slug}`}
                className="flex flex-col border-none  bg-transparent gap-4 rounded-t-xl rounded-b-4xl overflow-hidden" /* Switched to flex-col for consistent height; moved gap here */
              >
                {!!item?.images && (
                  <figure className="relative w-full aspect-square bg-gradient-to-br from-blue-400 via-white to-blue-300   border-none">
                    {' '}
                    {/* Fixed aspect-square for uniform image height */}
                    <Image
                      unoptimized
                      src={
                        // item.images.map((img) => img.url)[0] ||
                        '/images/9.jpg' || '/images/fallback-image.webp'
                      }
                      fill
                      alt={item.name!}
                      className={cn(
                        'object-cover mix-blend-multiply rounded-xl overflow-hidden'
                      )}
                    />
                  </figure>
                )}
                <article className="absolute bottom-0 w-full h-1/3 bg-primary/20 backdrop-blur-xl rounded-t-xl rounded-b-4xl flex  py-3 px-3 text-pretty text-xs md:text-sm lg:text-base">
                  <div className="pt-2 flex flex-col gap-0.5">
                    <p className="font-bold">{item.name}</p>
                    <p className="font-semibold opacity-60">
                      {item.specialization!.name}
                    </p>
                  </div>
                  <div className="absolute bottom-1 left-1 flex items-center justify-center size-12 rounded-full bg-gradient-to-bl from-white via-blue-900/70 to-white">
                    <span className="rotate-45 p-0.5">
                      <ArrowLeft className="text-white" />
                    </span>
                  </div>
                </article>
              </TransitionLink>
            </FadeIn>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className=" flex items-center justify-center cursor-pointer size-12 bg-background/30 backdrop-blur-sm border-none top-1/2 -translate-y-1/2 left-2" />
      <CarouselNext className="hidden lg:flex items-center justify-center cursor-pointer size-12 bg-background/30 backdrop-blur-sm border-none top-1/2 -translate-y-1/2 right-4" />
    </Carousel>
  )
}
