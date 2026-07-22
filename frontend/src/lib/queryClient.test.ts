import { describe, expect, it } from 'vitest'
import { ApiError } from './api/ApiError.ts'
import { createQueryClient } from './queryClient.ts'

function retryOption(): (failureCount: number, error: Error) => boolean {
  const retry = createQueryClient().getDefaultOptions().queries?.retry

  if (typeof retry !== 'function') {
    throw new Error('retry padrão deveria ser uma função')
  }

  return retry
}

function apiError(kind: 'network' | 'client' | 'server' | 'parse'): ApiError {
  return new ApiError('falhou', { kind })
}

describe('createQueryClient', () => {
  it('não repete erros de cliente nem de formato', () => {
    const retry = retryOption()

    expect(retry(0, apiError('client'))).toBe(false)
    expect(retry(0, apiError('parse'))).toBe(false)
  })

  it('repete falhas de rede e do servidor', () => {
    const retry = retryOption()

    expect(retry(0, apiError('network'))).toBe(true)
    expect(retry(0, apiError('server'))).toBe(true)
  })

  it('para após o limite de tentativas', () => {
    const retry = retryOption()

    expect(retry(2, apiError('network'))).toBe(false)
  })

  it('não repete mutations', () => {
    expect(createQueryClient().getDefaultOptions().mutations?.retry).toBe(false)
  })

  it('reporta falha de rede em vez de pausar a requisição', () => {
    const defaults = createQueryClient().getDefaultOptions()

    expect(defaults.queries?.networkMode).toBe('always')
    expect(defaults.mutations?.networkMode).toBe('always')
  })
})
