import type { Pokemon } from '../pokemon/pokemon.schema.ts'

export function applyMove(
  pokemons: readonly Pokemon[],
  pokemonId: number,
  toSlot: number,
): Pokemon[] {
  const dragged = pokemons.find((pokemon) => pokemon.id === pokemonId)

  if (dragged === undefined || dragged.slot === toSlot) {
    return [...pokemons]
  }

  const fromSlot = dragged.slot

  return pokemons.map((pokemon) => {
    if (pokemon.id === pokemonId) {
      return { ...pokemon, slot: toSlot }
    }
    if (pokemon.slot === toSlot) {
      return { ...pokemon, slot: fromSlot }
    }
    return pokemon
  })
}
