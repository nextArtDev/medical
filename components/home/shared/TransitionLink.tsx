import { Link as NextViewTransitionsLink } from 'next-view-transitions'
import React from 'react'

type NextLinkProps = React.ComponentProps<typeof NextViewTransitionsLink>

export type TransitionLinkProps = NextLinkProps

export const TransitionLink = React.forwardRef<
  HTMLAnchorElement,
  TransitionLinkProps
>(({ ...props }, ref) => {
  return <NextViewTransitionsLink ref={ref} {...props} />
})

TransitionLink.displayName = 'TransitionLink'
