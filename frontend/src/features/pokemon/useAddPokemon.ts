import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult } from '@tanstack/react-query'
import { createPokemon } from './pokemon.service.ts'
import type { PokemonAttributes, PokemonPosition } from './pokemon.service.ts'
import { boxKeys } from '../box/useBoxPokemons.ts'
import type { Pokemon } from './pokemon.schema.ts'

export function useAddPokemon(
  code: string,
  boxNumber: number,
  onAdded?: (pokemon: Pokemon) => void,
): UseMutationResult<Pokemon, Error, PokemonAttributes & PokemonPosition> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ boxNumber: box, slot, ...attributes }) =>
      createPokemon(code, attributes, { boxNumber: box, slot }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({
        queryKey: boxKeys.list(code, boxNumber),
      })
      onAdded?.(created)
    },
  })
}
