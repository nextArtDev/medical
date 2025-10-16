import { type ClassValue, clsx } from 'clsx'
import { HelpCircle, icons, LucideIcon } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { redirect } from 'next/navigation'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getIconComponent(iconName: string): LucideIcon {
  // / iconName has to be PascalCase (Starts with capital letter) and match the name in lucide-react
  // console.log('Looking for icon with name:', `|${iconName}|`)
  if (!iconName) {
    return HelpCircle // Default fallback icon if no iconName is provided
  }

  const IconComponent = icons[iconName as keyof typeof icons]

  if (IconComponent) {
    return IconComponent
  }

  // console.warn(`Icon "${iconName}" not found. Falling back to default icon.`)
  return HelpCircle // Default fallback icon: ?
  // calling it: const IconComponent = getIconComponent('IconName');
  // then use it in JSX: <IconComponent  stroke='currentColor' className='' />
}

export function getAppTimeZone(): string {
  const defaultTimeZone = 'Asia/Tehran'
  return process.env.APP_TIMEZONE || defaultTimeZone
}

export const redirectToErrorPage = (
  errorType: string,
  errorMessage: string
) => {
  const searchParams = new URLSearchParams({
    error: errorType,
    message: encodeURIComponent(errorMessage),
  })
  // Redirect to the root path with error info
  redirect(`/?${searchParams.toString()}`)
}
