import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { JSX, ReactNode } from 'react'
import {
  testQueryClient,
  withProviders,
} from '../../test/renderWithProviders.tsx'
import { collectionKeys } from './useCollection.ts'
import { useAddBox } from './useAddBox.ts'

const comDuasBoxes = {
  code: 'A7K9F2QX',
  boxCount: 2,
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

describe('useAddBox', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('adiciona a box e abre a recém-criada', async () => {
    mockFetch(comDuasBoxes)
    const onAdded = vi.fn()
    const client = testQueryClient()

    function wrapper({ children }: { children: ReactNode }): JSX.Element {
      return withProviders(children, client)
    }

    const { result } = renderHook(() => useAddBox('A7K9F2QX', onAdded), {
      wrapper,
    })

    result.current.mutate()

    await waitFor(() => {
      expect(onAdded).toHaveBeenCalledWith(2)
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/A7K9F2QX/boxes',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(client.getQueryData(collectionKeys.detail('A7K9F2QX'))).toEqual(
      comDuasBoxes,
    )
  })

  it('expõe o erro de limite atingido', async () => {
    mockFetch({ error: 'limite de 32 boxes atingido' }, 409)

    function wrapper({ children }: { children: ReactNode }): JSX.Element {
      return withProviders(children)
    }

    const { result } = renderHook(() => useAddBox('A7K9F2QX'), { wrapper })

    result.current.mutate()

    await waitFor(() => {
      expect(result.current.error).toMatchObject({ status: 409 })
    })
  })
})
