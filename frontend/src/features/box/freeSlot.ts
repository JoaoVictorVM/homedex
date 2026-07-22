import { slotsPerBox } from '../pokemon/pokemon.schema.ts'
import type { Pokemon } from '../pokemon/pokemon.schema.ts'

export function firstFreeSlot(pokemons: readonly Pokemon[]): number | null {
  const taken = new Set(pokemons.map((pokemon) => pokemon.slot))

  for (let slot = 0; slot < slotsPerBox; slot += 1) {
    if (!taken.has(slot)) {
      return slot
    }
  }

  return null
}
