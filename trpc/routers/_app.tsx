import { z } from 'zod'
import { baseProcedure, createTRPCRouter } from '../init'
import { doctorsRouter } from '@/lib/trpc/doctors/server/routers'

export const appRouter = createTRPCRouter({
  doctors: doctorsRouter,
  hello: baseProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      }
    }),
})

// export type definition of API
export type AppRouter = typeof appRouter
