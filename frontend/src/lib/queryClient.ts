import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api/ApiError.ts'

const maxRetries = 2

function shouldRetry(failureCount: number, error: Error): boolean {
  if (failureCount >= maxRetries) {
    return false
  }

  if (error instanceof ApiError) {
    return error.kind === 'network' || error.kind === 'server'
  }

  return false
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        networkMode: 'always',
        retry: shouldRetry,
      },
      mutations: {
        networkMode: 'always',
        retry: false,
      },
    },
  })
}
