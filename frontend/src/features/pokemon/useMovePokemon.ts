import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult } from '@tanstack/react-query'
import { movePokemon } from './pokemon.service.ts'
import { boxKeys } from '../box/useBoxPokemons.ts'
import type { Pokemon } from './pokemon.schema.ts'

type MoveInput = {
  pokemonId: number
  slot: number
}

export function useMovePokemon(
  code: string,
  boxNumber: number,
): UseMutationResult<Pokemon[], Error, MoveInput> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pokemonId, slot }: MoveInput) =>
      movePokemon(code, pokemonId, { boxNumber, slot }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: boxKeys.list(code, boxNumber),
      })
    },
  })
}
