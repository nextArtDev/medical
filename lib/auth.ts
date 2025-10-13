// import crypto from 'crypto'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'
import { admin, phoneNumber } from 'better-auth/plugins'
import prisma from './prisma'
import { cache } from 'react'
import { headers } from 'next/headers'
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'mysql', // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: false, // Disable email/password since we want phone-only
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        input: false, // user cannot set the own role
      },
      phoneNumber: {
        type: 'string',
        input: false, // user cannot set the own phone
      },
    },
  },
  plugins: [
    admin(),
    phoneNumber({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      sendOTP: async ({ phoneNumber, code }, request) => {
        // const verificationCode = crypto.randomInt(100123, 999879)
        if (!code) {
          //   throw   Error 'مشکلی پیش آمده، لطفا دوباره امتحان کنید!'
          return
        }
        const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000)

        // 1. Check if there's a recent OTP request for this number
        const existingRequest = await prisma.otpRateLimit.findUnique({
          where: { phoneNumber },
        })

        if (existingRequest && existingRequest.lastSentAt > threeMinutesAgo) {
          const timeLeft = Math.ceil(
            (existingRequest.lastSentAt.getTime() +
              3 * 60 * 1000 -
              Date.now()) /
              1000
          )
          // 2. If it's too soon, throw an error that better-auth will send to the client
          throw new Error(
            `Please wait ${timeLeft} more seconds before requesting a new code.`
          )
        }
        console.log({ code, phoneNumber })
        return
        // Implement sending OTP code via SMS
      },
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => {
          return `${phoneNumber}@my-site.com`
        },
        //optionally, you can also pass `getTempName` function to generate a temporary name for the user
        getTempName: (phoneNumber) => {
          return phoneNumber //by default, it will use the phone number as the name
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      callbackOnVerification: async ({ phoneNumber, user }, request) => {
        // Implement callback after phone number verification
        // console.log({ phoneNumber })
        // console.log({ user })
      },
    }),
    nextCookies(),
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 60, // 60 days
    },
  },
  // advanced: {
  //   generateId: false, // Let Prisma handle ID generation
  // },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user

export const currentUser = cache(async () => {
  'use server'
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    return null
  }

  // Fetch the complete user data including role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      role: true,
    },
  })

  return user
})
