import { render } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import type { JSX, ReactNode } from 'react'
import { I18nProvider } from '../shared/i18n/I18nProvider.tsx'
import { createQueryClient } from '../lib/queryClient.ts'

export function testQueryClient(): QueryClient {
  const client = createQueryClient()
  const defaults = client.getDefaultOptions()

  client.setDefaultOptions({
    queries: { ...defaults.queries, retry: false },
    mutations: { ...defaults.mutations, retry: false },
  })

  return client
}

export function withProviders(
  children: ReactNode,
  client = testQueryClient(),
): JSX.Element {
  return (
    <QueryClientProvider client={client}>
      <I18nProvider>{children}</I18nProvider>
    </QueryClientProvider>
  )
}

export function renderWithProviders(
  children: ReactNode,
  client = testQueryClient(),
): RenderResult {
  return render(withProviders(children, client))
}
