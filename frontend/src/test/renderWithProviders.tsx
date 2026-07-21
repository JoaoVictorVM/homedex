import { render } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { JSX, ReactNode } from 'react'
import { I18nProvider } from '../shared/i18n/I18nProvider.tsx'

export function testQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
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
