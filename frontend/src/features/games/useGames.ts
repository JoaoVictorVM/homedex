import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { fetchGames } from './games.service.ts'
import type { Game } from './game.schema.ts'

export const gameKeys = {
  list: (code: string) => ['games', code] as const,
}

export function useGames(code: string): UseQueryResult<Game[], Error> {
  return useQuery({
    queryKey: gameKeys.list(code),
    queryFn: ({ signal }) => fetchGames(code, signal),
  })
}
