import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult } from '@tanstack/react-query'
import { setGameVisibility } from './games.service.ts'
import { gameKeys } from './useGames.ts'
import type { Game } from './game.schema.ts'

type ToggleInput = {
  gameId: number
  visible: boolean
}

export function useToggleGameVisibility(
  code: string,
): UseMutationResult<Game, Error, ToggleInput> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ gameId, visible }: ToggleInput) =>
      setGameVisibility(code, gameId, visible),
    onSuccess: (updated) => {
      queryClient.setQueryData<Game[]>(gameKeys.list(code), (current) =>
        current?.map((game) => (game.id === updated.id ? updated : game)),
      )
    },
  })
}
