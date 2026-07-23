import { z } from 'zod'
import { request, requestEmpty } from '../../lib/api/client.ts'
import { pokemonListSchema, pokemonSchema } from './pokemon.schema.ts'
import type { Pokemon, PokemonGender } from './pokemon.schema.ts'

const spriteSchema = z.object({ sprite: z.string() })

export type PokemonAttributes = {
  pokemonName: string
  nickname: string
  isShiny: boolean
  gender: PokemonGender
  form: string
  gameId: number
}

export type PokemonPosition = {
  boxNumber: number
  slot: number
}

function pokemonsPath(code: string): string {
  return `/collections/${encodeURIComponent(code)}/pokemons`
}

export async function fetchSprite(
  name: string,
  form: string,
  shiny: boolean,
  signal?: AbortSignal,
): Promise<string> {
  const params = new URLSearchParams({ name })
  if (form !== '') {
    params.set('form', form)
  }
  if (shiny) {
    params.set('shiny', 'true')
  }

  const result = await request(`/sprite?${params.toString()}`, {
    schema: spriteSchema,
    signal,
  })

  return result.sprite
}

export function fetchBox(
  code: string,
  boxNumber: number,
  signal?: AbortSignal,
): Promise<Pokemon[]> {
  return request(`${pokemonsPath(code)}?box=${boxNumber}`, {
    schema: pokemonListSchema,
    signal,
  })
}

export function createPokemon(
  code: string,
  attributes: PokemonAttributes,
  position: PokemonPosition,
  signal?: AbortSignal,
): Promise<Pokemon> {
  return request(pokemonsPath(code), {
    method: 'POST',
    body: { ...attributes, ...position },
    schema: pokemonSchema,
    signal,
  })
}

export function updatePokemon(
  code: string,
  pokemonId: number,
  attributes: PokemonAttributes,
  signal?: AbortSignal,
): Promise<Pokemon> {
  return request(`${pokemonsPath(code)}/${pokemonId}`, {
    method: 'PATCH',
    body: attributes,
    schema: pokemonSchema,
    signal,
  })
}

export function movePokemon(
  code: string,
  pokemonId: number,
  position: PokemonPosition,
  signal?: AbortSignal,
): Promise<Pokemon[]> {
  return request(`${pokemonsPath(code)}/${pokemonId}/position`, {
    method: 'PATCH',
    body: position,
    schema: pokemonListSchema,
    signal,
  })
}

export function deletePokemon(
  code: string,
  pokemonId: number,
  signal?: AbortSignal,
): Promise<void> {
  return requestEmpty(`${pokemonsPath(code)}/${pokemonId}`, {
    method: 'DELETE',
    signal,
  })
}
