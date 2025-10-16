'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode, ComponentProps } from 'react'

export default function QueryProviders({
  children,
}: {
  children: ComponentProps<typeof QueryClientProvider>['children']
}) {
  // Use useState instead of useRef for better SSR handling
  function makeQueryClient() {
    return new QueryClient({
      defaultOptions: {
        queries: {
          // With SSR, we usually want to set some default staleTime
          // above 0 to avoid refetching on first mount.
          staleTime: 60 * 1000, // 1 minute
        },
      },
    })
  }

  let browserQueryClient: QueryClient | undefined = undefined

  function getQueryClient() {
    if (typeof window === 'undefined') {
      // Server: Always make a new query client
      return makeQueryClient()
    } else {
      // Browser: Make a new query client if we don't already have one
      // This is to make sure we don't accidentally share query clients across requests
      if (!browserQueryClient) browserQueryClient = makeQueryClient()
      return browserQueryClient
    }
  }
  const queryClient = getQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  )
}
