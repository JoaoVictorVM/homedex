import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult } from '@tanstack/react-query'
import { createGame, deleteGame, renameGame } from './games.service.ts'
import { gameKeys } from './useGames.ts'
import type { Game } from './game.schema.ts'

export function useCreateHackrom(
  code: string,
  onCreated?: () => void,
): UseMutationResult<Game, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => createGame(code, name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: gameKeys.list(code) })
      onCreated?.()
    },
  })
}

export function useRenameHackrom(
  code: string,
  onRenamed?: () => void,
): UseMutationResult<Game, Error, { gameId: number; name: string }> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ gameId, name }: { gameId: number; name: string }) =>
      renameGame(code, gameId, name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: gameKeys.list(code) })
      onRenamed?.()
    },
  })
}

export function useDeleteHackrom(
  code: string,
  onDeleted?: () => void,
): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (gameId: number) => deleteGame(code, gameId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: gameKeys.list(code) })
      onDeleted?.()
    },
  })
}
