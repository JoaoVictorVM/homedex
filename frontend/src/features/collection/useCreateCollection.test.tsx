import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { JSX, ReactNode } from 'react'
import {
  testQueryClient,
  withProviders,
} from '../../test/renderWithProviders.tsx'
import { collectionKeys } from './useCollection.ts'
import { useCreateCollection } from './useCreateCollection.ts'

const novaColecao = {
  code: 'DHE4SNN2',
  boxCount: 1,
  createdAt: '2026-07-21T15:25:49.405505-03:00',
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

describe('useCreateCollection', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('cria a coleção e avisa o código gerado', async () => {
    mockFetch(novaColecao, 201)
    const onCreated = vi.fn()
    const client = testQueryClient()

    function wrapper({ children }: { children: ReactNode }): JSX.Element {
      return withProviders(children, client)
    }

    const { result } = renderHook(() => useCreateCollection(onCreated), {
      wrapper,
    })

    result.current.mutate()

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith('DHE4SNN2')
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(client.getQueryData(collectionKeys.detail('DHE4SNN2'))).toEqual(
      novaColecao,
    )
  })

  it('expõe erro sem avisar código', async () => {
    mockFetch({ error: 'não foi possível criar a coleção' }, 500)
    const onCreated = vi.fn()

    function wrapper({ children }: { children: ReactNode }): JSX.Element {
      return withProviders(children)
    }

    const { result } = renderHook(() => useCreateCollection(onCreated), {
      wrapper,
    })

    result.current.mutate()

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(onCreated).not.toHaveBeenCalled()
  })
})
