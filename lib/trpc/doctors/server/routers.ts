import { PAGINATION } from '@/constant/pagination'
import { Prisma } from '@/lib/generated/prisma'
import prisma from '@/lib/prisma'
import { createTRPCRouter, baseProcedure } from '@/trpc/init'

import z from 'zod'

export const doctorsRouter = createTRPCRouter({
  getInfiniteMany: baseProcedure
    .input(
      z.object({
        limit: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(20),
        cursor: z.string().nullish(), // Cursor for pagination
        search: z.string().default(''),
        specialty: z.array(z.string()).nullish(),

        // sortBy: z.enum(SORT_OPTIONS).default('newest'),
      })
    )
    .query(async ({ input }) => {
      const { limit, cursor, search, specialty } = input

      const where: Prisma.DoctorProfileWhereInput = { AND: [] }
      const andConditions = where.AND as Prisma.DoctorProfileWhereInput[]

      // Search filter
      if (search.trim()) {
        andConditions.push({
          OR: [
            {
              doctor: {
                OR: [
                  { name: { contains: search } },
                  // { specialty: { contains: search } },
                ],
              },
            },

            { specialty: { contains: search } },
          ],
        })
      }

      // if (specialty) pushToAnd({ specialty })

      // const docotorWhere: Prisma.UserWhereInput = { AND: [] }
      // const pushToDoctorAnd = (condition: Prisma.UserWhereInput) =>
      //   (docotorWhere.AND as Prisma.UserWhereInput[]).push(condition)

      if (specialty && specialty.length > 0) {
        andConditions.push({
          specialty: { in: specialty },
        })
      }

      const userWhere: Prisma.UserWhereInput = { AND: [] }
      const userAndConditions = userWhere.AND as Prisma.UserWhereInput[]

      if (specialty && specialty.length > 0) {
        userAndConditions.push({
          doctorProfile: { specialty: { in: specialty } },
        })
      }

      const [items] = await Promise.all([
        prisma.doctorProfile.findMany({
          where,
          include: {
            doctor: {
              include: {
                images: { take: 1, orderBy: { created_at: 'asc' } },
              },
            },
          },
          // orderBy,
          take: limit + 1, // Fetch one extra to check if there's more
          cursor: cursor ? { profileId: cursor } : undefined,
          skip: cursor ? 1 : 0, // Skip the cursor item itself
        }),
      ])
      // Determine if there's a next page
      let nextCursor: string | null = null
      if (items.length > limit) {
        const nextItem = items.pop() // Remove the extra item
        nextCursor = nextItem!.profileId
      }

      return {
        items,
        nextCursor,
      }
    }),
  getFilterOptions: baseProcedure
    .input(
      z.object({
        search: z.string().optional(),
        specialty: z.array(z.string()).nullish(),
      })
    )
    .query(async ({ input }) => {
      const { search, specialty } = input

      // Build base where clause (same as getMany)
      const where: Prisma.DoctorProfileWhereInput = { AND: [] }
      const andConditions = where.AND as Prisma.DoctorProfileWhereInput[]

      if (search) {
        andConditions.push({
          OR: [
            {
              doctor: {
                OR: [
                  { name: { contains: search } },
                  // { s: { contains: search } },
                ],
              },
            },

            { specialty: { contains: search } },
          ],
        })
      }

      // Fetch products matching current filters
      const doctors = await prisma.doctorProfile.findMany({
        where,
        select: {
          // userId:true,
          specializations: true,
          specialty: true,
          doctor: {
            select: {
              name: true,
              isActive: true,
              images: {
                select: {
                  url: true,
                },
              },
            },
          },
        },
      })

      const specializationCount = new Map<
        string,
        { name: string; count: number }
      >()
      const specialtyCounts = new Map<string, number>()

      doctors.forEach((doctor) => {
        // Count brands
        if (doctor.specializations) {
          doctor.specializations.forEach((specialization) => {
            if (specialization) {
              const existing = specializationCount.get(specialization)
              if (existing) {
                existing.count++
              } else {
                specializationCount.set(specialization, {
                  name: specialization,
                  count: 1,
                })
              }
            }
          })
        }

        // Count colors and sizes from variants
        doctor.specializations.forEach((specialization) => {
          // Colors
          if (specialization) {
            const existing = specializationCount.get(specialization)
            if (existing) {
              existing.count++
            } else {
              specializationCount.set(specialization, {
                name: specialization,
                count: 1,
              })
            }
          }

          // Sizes
          if (specialization) {
            const existing = specializationCount.get(specialization)
            if (existing) {
              existing.count++
            } else {
              specializationCount.set(specialization, {
                name: specialization,
                count: 1,
              })
            }
          }
        })
      })

      return {
        specializations: Array.from(specializationCount.entries())
          .map(([id, data]) => ({
            value: data.name,
            label: data.name,
            count: data.count,
          }))
          .sort((a, b) => b.count - a.count),

        specialties: Array.from(specializationCount.entries())
          .map(([id, data]) => ({
            value: data.name,
            label: data.name,
            count: data.count,
          }))
          .sort((a, b) => {
            // Custom size sorting

            return b.count - a.count
          }),
      }
    }),
})
