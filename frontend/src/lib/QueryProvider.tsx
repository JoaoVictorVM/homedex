import { useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from './queryClient.ts'

export function QueryProvider({
  children,
}: {
  children: ReactNode
}): JSX.Element {
  const [client] = useState(createQueryClient)

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
