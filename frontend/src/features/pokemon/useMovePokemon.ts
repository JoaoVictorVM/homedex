import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult } from '@tanstack/react-query'
import { movePokemon } from './pokemon.service.ts'
import { boxKeys } from '../box/useBoxPokemons.ts'
import { applyMove } from '../box/applyMove.ts'
import type { Pokemon } from './pokemon.schema.ts'

type MoveInput = {
  pokemonId: number
  slot: number
}

type MoveContext = {
  previous: Pokemon[] | undefined
}

export function useMovePokemon(
  code: string,
  boxNumber: number,
): UseMutationResult<Pokemon[], Error, MoveInput, MoveContext> {
  const queryClient = useQueryClient()
  const queryKey = boxKeys.list(code, boxNumber)

  return useMutation({
    mutationFn: ({ pokemonId, slot }: MoveInput) =>
      movePokemon(code, pokemonId, { boxNumber, slot }),
    onMutate: async ({ pokemonId, slot }): Promise<MoveContext> => {
      await queryClient.cancelQueries({ queryKey })

      const previous = queryClient.getQueryData<Pokemon[]>(queryKey)

      queryClient.setQueryData<Pokemon[]>(queryKey, (current) =>
        current === undefined ? current : applyMove(current, pokemonId, slot),
      )

      return { previous }
    },
    onError: (_error, _input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
  })
}
