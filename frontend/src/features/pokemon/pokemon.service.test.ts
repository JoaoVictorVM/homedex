import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createPokemon,
  deletePokemon,
  fetchBox,
  movePokemon,
  updatePokemon,
} from './pokemon.service.ts'
import type { PokemonAttributes } from './pokemon.service.ts'

const code = 'A7K9F2QX'

const atributos: PokemonAttributes = {
  pokemonName: 'rattata',
  nickname: 'Ratinho',
  isShiny: true,
  gender: 'female',
  form: 'rattata-alola',
  gameId: 738,
}

const rattata = {
  id: 23,
  ...atributos,
  boxNumber: 1,
  slot: 5,
  sprite: 'https://sprites/shiny/10091.png',
}

const bulbasaur = {
  id: 24,
  pokemonName: 'bulbasaur',
  nickname: '',
  isShiny: false,
  gender: 'male',
  form: '',
  gameId: 738,
  boxNumber: 1,
  slot: 0,
  sprite: 'https://sprites/1.png',
}

function mockFetch(body: unknown, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        status === 204
          ? new Response(null, { status })
          : new Response(JSON.stringify(body), {
              status,
              headers: { 'Content-Type': 'application/json' },
            }),
      ),
    ),
  )
}

describe('pokemon.service', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lista os pokémon de uma box', async () => {
    mockFetch([bulbasaur, rattata])

    await expect(fetchBox(code, 1)).resolves.toHaveLength(2)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/A7K9F2QX/pokemons?box=1',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('retorna lista vazia para box sem pokémon', async () => {
    mockFetch([])

    await expect(fetchBox(code, 3)).resolves.toEqual([])
  })

  it('adiciona pokémon enviando atributos e posição', async () => {
    mockFetch(rattata)

    await expect(
      createPokemon(code, atributos, { boxNumber: 1, slot: 5 }),
    ).resolves.toEqual(rattata)

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/A7K9F2QX/pokemons',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ ...atributos, boxNumber: 1, slot: 5 }),
      }),
    )
  })

  it('edita atributos sem tocar na posição', async () => {
    mockFetch(rattata)

    await updatePokemon(code, 23, atributos)

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/A7K9F2QX/pokemons/23',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(atributos),
      }),
    )
  })

  it('move pokémon e devolve os afetados', async () => {
    mockFetch([
      { ...rattata, slot: 0 },
      { ...bulbasaur, slot: 5 },
    ])

    const afetados = await movePokemon(code, 23, { boxNumber: 1, slot: 0 })

    expect(afetados).toHaveLength(2)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/A7K9F2QX/pokemons/23/position',
      expect.objectContaining({
        method: 'PATCH',
        body: '{"boxNumber":1,"slot":0}',
      }),
    )
  })

  it('remove pokémon', async () => {
    mockFetch(null, 204)

    await expect(deletePokemon(code, 23)).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/A7K9F2QX/pokemons/23',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('propaga slot ocupado como conflito', async () => {
    mockFetch({ error: 'já existe um pokémon nesse slot' }, 409)

    await expect(
      createPokemon(code, atributos, { boxNumber: 1, slot: 5 }),
    ).rejects.toMatchObject({
      status: 409,
      isConflict: true,
      message: 'já existe um pokémon nesse slot',
    })
  })

  it('propaga pokémon inexistente na PokéAPI', async () => {
    mockFetch({ error: 'pokémon não encontrado na PokéAPI' }, 400)

    await expect(
      createPokemon(
        code,
        { ...atributos, pokemonName: 'naoexiste' },
        { boxNumber: 1, slot: 5 },
      ),
    ).rejects.toMatchObject({ status: 400, kind: 'client' })
  })
})
