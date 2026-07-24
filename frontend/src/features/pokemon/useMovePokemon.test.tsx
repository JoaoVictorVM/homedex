import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { JSX, ReactNode } from 'react'
import {
  testQueryClient,
  withProviders,
} from '../../test/renderWithProviders.tsx'
import { boxKeys } from '../box/useBoxPokemons.ts'
import { useMovePokemon } from './useMovePokemon.ts'
import type { Pokemon } from './pokemon.schema.ts'

function pokemon(id: number, slot: number, name = 'bulbasaur'): Pokemon {
  return {
    id,
    pokemonName: name,
    nickname: '',
    isShiny: false,
    gender: 'male',
    form: '',
    gameId: 1,
    boxNumber: 1,
    slot,
    sprite: 'https://sprites/1.png',
  }
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

function slotById(list: Pokemon[] | undefined): Record<number, number> {
  return Object.fromEntries((list ?? []).map((p) => [p.id, p.slot]))
}

describe('useMovePokemon', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('envia a nova posição do pokémon arrastado', async () => {
    mockFetch([pokemon(7, 8)])

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

  it('atualiza a box na hora, antes da resposta (optimistic)', async () => {
    mockFetch([pokemon(7, 5), pokemon(8, 0, 'charmander')])
    const client = testQueryClient()
    const key = boxKeys.list('A7K9F2QX', 1)
    client.setQueryData(key, [pokemon(7, 0), pokemon(8, 5, 'charmander')])

    const { result } = renderHook(() => useMovePokemon('A7K9F2QX', 1), {
      wrapper: ({ children }) => withProviders(children, client),
    })

    result.current.mutate({ pokemonId: 7, slot: 5 })

    await waitFor(() => {
      expect(slotById(client.getQueryData(key))).toEqual({ 7: 5, 8: 0 })
    })
  })

  it('desfaz a mudança quando o servidor rejeita', async () => {
    mockFetch({ error: 'box ou slot fora dos limites da coleção' }, 400)
    const client = testQueryClient()
    const key = boxKeys.list('A7K9F2QX', 1)
    client.setQueryData(key, [pokemon(7, 0)])

    const { result } = renderHook(() => useMovePokemon('A7K9F2QX', 1), {
      wrapper: ({ children }) => withProviders(children, client),
    })

    result.current.mutate({ pokemonId: 7, slot: 40 })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(slotById(client.getQueryData(key))).toEqual({ 7: 0 })
  })
})

function wrapper({ children }: { children: ReactNode }): JSX.Element {
  return withProviders(children)
}
