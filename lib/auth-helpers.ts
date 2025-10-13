'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import { betterFetch } from '@better-fetch/fetch'

export async function getCurrentUser() {
  // console.log('Session')
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session?.user?.id) {
      return null
    }

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
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

type Session = typeof auth.$Infer.Session

export async function getCurrentUserWithFetch() {
  try {
    const headersList = await headers()
    const cookies = headersList.get('cookie')

    const { data: session, error } = await betterFetch<Session>(
      '/api/auth/get-session',
      {
        baseURL: process.env.BETTER_AUTH_URL || 'https://sarina-leather.com',
        headers: {
          cookie: cookies || '',
        },
      }
    )

    if (error || !session?.user?.id) {
      return null // or redirect('/sign-in') if you want immediate redirect
    }

    // Get additional user data from database
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
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}
