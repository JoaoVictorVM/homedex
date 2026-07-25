import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { JSX, ReactNode } from 'react'
import { withProviders } from '../../test/renderWithProviders.tsx'
import { useCollectionSession } from './useCollectionSession.ts'

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

describe('useCollectionSession', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('começa na entrada quando não há código salvo', () => {
    mockFetch(colecao)

    const { result } = renderHook(() => useCollectionSession(), { wrapper })

    expect(result.current.session.status).toBe('entry')
  })

  it('restaura a sessão salva antes de mostrar a entrada', async () => {
    localStorage.setItem('homedex.code', 'A7K9F2QX')
    mockFetch(colecao)

    const { result } = renderHook(() => useCollectionSession(), { wrapper })

    expect(result.current.session.status).toBe('restoring')

    await waitFor(() => {
      expect(result.current.session.status).toBe('ready')
    })
  })

  it('entra na coleção informada pelo usuário', async () => {
    mockFetch(colecao)

    const { result } = renderHook(() => useCollectionSession(), { wrapper })

    act(() => {
      result.current.enter('A7K9F2QX')
    })

    await waitFor(() => {
      expect(result.current.session.status).toBe('ready')
    })
    expect(localStorage.getItem('homedex.code')).toBe('A7K9F2QX')
  })

  it('esquece a coleção salva que não existe mais', async () => {
    localStorage.setItem('homedex.code', 'A7K9F2QX')
    mockFetch({ error: 'código de coleção não encontrado' }, 404)

    const { result } = renderHook(() => useCollectionSession(), { wrapper })

    await waitFor(() => {
      expect(localStorage.getItem('homedex.code')).toBeNull()
    })
    expect(result.current.session.status).toBe('entry')
  })

  it('sai da coleção ao pedido do usuário', async () => {
    mockFetch(colecao)

    const { result } = renderHook(() => useCollectionSession(), { wrapper })

    act(() => {
      result.current.enter('A7K9F2QX')
    })
    await waitFor(() => {
      expect(result.current.session.status).toBe('ready')
    })

    act(() => {
      result.current.leave()
    })

    expect(result.current.session.status).toBe('entry')
    expect(localStorage.getItem('homedex.code')).toBeNull()
  })
})
