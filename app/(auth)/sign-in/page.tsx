import MultiStepFormAuth from './components/MultiSteFormAuth'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-helpers'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
// import Image from 'next/image'
// import heroImage from '../../../public/images/hero-image.webp'

export const dynamic = 'force-dynamic'

const page = async () => {
  const session = await getCurrentUser()

  if (session?.phoneNumber) {
    redirect('/')
  }
  return (
    <section
      aria-label="sign-in"
      className="relative w-full h-full min-h-screen"
    >
      {/* <Image fill src={heroImage} alt="Store Logo" className="  object-cover" /> */}
      <div className="absolute inset-0 bg-background/5 backdrop-blur-xs" />
      <Link
        href={'/'}
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-10 left-10 flex gap-1 font-bold'
        )}
      >
        بازگشت &larr;
      </Link>
      <div className="relative w-full h-full flex items-center justify-center max-w-sm mx-auto">
        <MultiStepFormAuth />
      </div>
    </section>
  )
}

export default page
