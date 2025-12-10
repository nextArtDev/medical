import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { getQueryClient, HydrateClient, trpc } from '@/trpc/server'
import React, { Suspense } from 'react'
import type { SearchParams } from 'nuqs/server'

import { ErrorBoundary } from 'react-error-boundary'
import { doctorsParamsLoader } from '@/lib/trpc/doctors/server/params-loader'
import { prefetchDoctors } from '@/lib/trpc/doctors/server/prefetch'
import DoctorCarousel from '@/components/home/doctor-card/doctor-carousel'
import DoctorGrid from './components/doctor-grid'
import { DoctorFilters } from './components/doctor-filters'
import { DoctorListView } from './components/doctor-list-view'

type Props = {
  searchParams: Promise<SearchParams>
}

const Page = async ({ searchParams }: Props) => {
  const queryClient = getQueryClient()
  const doctors = await queryClient.fetchQuery(
    trpc.doctors.getFilterOptions.queryOptions({})
  )
  const params = await doctorsParamsLoader(searchParams)
  prefetchDoctors({ ...params })
  //   const subCategories = await queryClient.fetchQuery(
  //     trpc.categories.getManySubCategories.queryOptions({
  //       categoryId: categories.items[0].id,
  //     })
  //   )
  const productParmas = await doctorsParamsLoader(searchParams)
  prefetchDoctors(productParmas)

  return (
    <div className="p-2 mx-auto flex flex-col w-full h-full gap-4  ">
      <HydrateClient>
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <DoctorListView doctors={doctors} />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
      <DoctorFilters />
      {/* <DoctorCarousel
        items={doctors.items.map((doctor) => {
          return {
            images: [{ url: '/images/9.jpg' }],
            slug: doctor.doctor.id,
            name: doctor.doctor.name || '',
            specialization: doctor.specializations || [],
          }
        })}
      /> */}
      {/* {doctors.items.map((doctor) => (
        <div key={doctor.doctor.id} className="grid grid-cols-3  ">
          <Card>
            <CardTitle>{doctor.doctor.name}</CardTitle>
            <CardDescription>
              {doctor.translations?.[0].description}
              <HydrateClient>
                <ErrorBoundary fallback={null}>
                  <Suspense fallback={null}>
                    <ClientSubCategories doctorId={doctor.id} />
                  </Suspense>
                </ErrorBoundary>
              </HydrateClient>
            </CardDescription>
          </Card>
        </div>
      ))} */}
      {/* {doctors.items.map((doctor) => (
        <div key={doctor.doctor.id} className="grid grid-cols-3  ">
          <Card>
            <CardTitle>{doctor.doctor.name}</CardTitle>
            <CardDescription>
            {doctor.translations?.[0].description}  
              <HydrateClient>
                <ErrorBoundary fallback={null}>
                  <Suspense fallback={null}>
                    <ClientSubCategories doctorId={doctor.id} />
                  </Suspense>
                </ErrorBoundary>
              </HydrateClient>
            </CardDescription>
          </Card>
        </div>
      ))} */}
      {/* <div className="container mx-auto p-4"> */}
      {/* <h1 className="text-3xl font-bold mb-20">Products</h1> */}

      {/* <ProductsFilters /> */}
      {/* <div className="py-16">
          <ProductsSearchFilters />
        </div>
        <HydrateClient>
          <ErrorBoundary fallback={null}>
            <Suspense fallback={<ProductsLoadingSkeleton />}>
              
              <ProductsInfiniteListMobileOptimized />
            </Suspense>
          </ErrorBoundary>
        </HydrateClient> */}
      {/* </div> */}
    </div>
  )
}

export default Page
