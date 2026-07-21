import { z } from 'zod'
import { maxBoxes } from '../collection/collection.schema.ts'

export const slotsPerBox = 30

export const genderSchema = z.enum(['male', 'female', 'genderless'])

export const pokemonSchema = z.object({
  id: z.int().positive(),
  pokemonName: z.string().min(1),
  nickname: z.string(),
  isShiny: z.boolean(),
  gender: genderSchema,
  form: z.string(),
  gameId: z.int().positive(),
  boxNumber: z.int().min(1).max(maxBoxes),
  slot: z
    .int()
    .min(0)
    .max(slotsPerBox - 1),
  sprite: z.string(),
})

export const pokemonListSchema = z.array(pokemonSchema)

export type PokemonGender = z.infer<typeof genderSchema>
export type Pokemon = z.infer<typeof pokemonSchema>
