import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult } from '@tanstack/react-query'
import { deletePokemon } from './pokemon.service.ts'
import { boxKeys } from '../box/useBoxPokemons.ts'

export function useDeletePokemon(
  code: string,
  boxNumber: number,
  onDeleted?: () => void,
): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (pokemonId: number) => deletePokemon(code, pokemonId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: boxKeys.list(code, boxNumber),
      })
      onDeleted?.()
    },
  })
}
