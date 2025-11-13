import { Role } from '@/lib/generated/prisma' // Import Role enum
import { redirect } from 'next/navigation'
import { auth } from './auth'
import { redirectToErrorPage } from './utils'
import { currentUser } from './auth-helpers'

export async function requireAdmin() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  // if (user.role !== Role.admin) {
  //   redirectToErrorPage(
  //     'UNAUTHORIZED',
  //     'You are not authorized to access this page.'
  //   )
  // }
  return user
}
