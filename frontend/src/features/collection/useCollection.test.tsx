import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { withProviders } from '../../test/renderWithProviders.tsx'
import { useCollection } from './useCollection.ts'

const colecao = {
  code: 'A7K9F2QX',
  boxCount: 1,
  createdAt: '2026-07-21T08:37:19.869463-03:00',
}

function mockFetch(body: unknown, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    ),
  )
}

function wrapper({ children }: { children: ReactNode }): JSX.Element {
  return withProviders(children)
}

describe('useCollection', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('não busca enquanto não há código', () => {
    mockFetch(colecao)

    const { result } = renderHook(() => useCollection(null), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('busca a coleção do código informado', async () => {
    mockFetch(colecao)

    const { result } = renderHook(() => useCollection('A7K9F2QX'), { wrapper })

    await waitFor(() => {
      expect(result.current.data).toEqual(colecao)
    })
  })

  it('expõe erro de código inexistente', async () => {
    mockFetch({ error: 'código de coleção não encontrado' }, 404)

    const { result } = renderHook(() => useCollection('AAAAAAAA'), { wrapper })

    await waitFor(() => {
      expect(result.current.error).toMatchObject({
        status: 404,
        message: 'código de coleção não encontrado',
      })
    })
  })
})
