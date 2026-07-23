import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { JSX, ReactNode } from 'react'
import { withProviders } from '../../test/renderWithProviders.tsx'
import { usePokemonForms } from './usePokemonForms.ts'

function mockForms(forms: string[]): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ forms }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    ),
  )
}

function wrapper({ children }: { children: ReactNode }): JSX.Element {
  return withProviders(children)
}

describe('usePokemonForms', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('não busca com o nome vazio', () => {
    mockForms([])

    const { result } = renderHook(() => usePokemonForms(''), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('busca as formas do pokémon informado', async () => {
    mockForms(['rattata', 'rattata-alola'])

    const { result } = renderHook(() => usePokemonForms('rattata'), { wrapper })

    await waitFor(() => {
      expect(result.current.data).toEqual(['rattata', 'rattata-alola'])
    })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/pokemon-forms?name=rattata',
      expect.objectContaining({ method: 'GET' }),
    )
  })
})
