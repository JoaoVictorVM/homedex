import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { JSX, ReactNode } from 'react'
import { withProviders } from '../../test/renderWithProviders.tsx'
import { useMovePokemon } from './useMovePokemon.ts'

const movido = {
  id: 7,
  pokemonName: 'bulbasaur',
  nickname: '',
  isShiny: false,
  gender: 'male',
  form: '',
  gameId: 1,
  boxNumber: 1,
  slot: 8,
  sprite: 'https://sprites/1.png',
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

describe('useMovePokemon', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('envia a nova posição do pokémon arrastado', async () => {
    mockFetch([movido])

    const { result } = renderHook(() => useMovePokemon('A7K9F2QX', 1), {
      wrapper,
    })

    result.current.mutate({ pokemonId: 7, slot: 8 })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/A7K9F2QX/pokemons/7/position',
      expect.objectContaining({
        method: 'PATCH',
        body: '{"boxNumber":1,"slot":8}',
      }),
    )
  })

  it('expõe erro de posição', async () => {
    mockFetch({ error: 'box ou slot fora dos limites da coleção' }, 400)

    const { result } = renderHook(() => useMovePokemon('A7K9F2QX', 1), {
      wrapper,
    })

    result.current.mutate({ pokemonId: 7, slot: 40 })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
