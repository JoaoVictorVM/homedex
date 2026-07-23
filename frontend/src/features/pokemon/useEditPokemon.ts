import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult } from '@tanstack/react-query'
import { updatePokemon } from './pokemon.service.ts'
import type { PokemonAttributes } from './pokemon.service.ts'
import { boxKeys } from '../box/useBoxPokemons.ts'
import type { Pokemon } from './pokemon.schema.ts'

export function useEditPokemon(
  code: string,
  boxNumber: number,
  pokemonId: number,
  onEdited?: (pokemon: Pokemon) => void,
): UseMutationResult<Pokemon, Error, PokemonAttributes> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (attributes: PokemonAttributes) =>
      updatePokemon(code, pokemonId, attributes),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({
        queryKey: boxKeys.list(code, boxNumber),
      })
      onEdited?.(updated)
    },
  })
}
