import { request, requestEmpty } from '../../lib/api/client.ts'
import { gameListSchema, gameSchema } from './game.schema.ts'
import type { Game } from './game.schema.ts'

function gamesPath(code: string): string {
  return `/collections/${encodeURIComponent(code)}/games`
}

export function fetchGames(
  code: string,
  signal?: AbortSignal,
): Promise<Game[]> {
  return request(gamesPath(code), { schema: gameListSchema, signal })
}

export function createGame(
  code: string,
  name: string,
  signal?: AbortSignal,
): Promise<Game> {
  return request(gamesPath(code), {
    method: 'POST',
    body: { name },
    schema: gameSchema,
    signal,
  })
}

export function renameGame(
  code: string,
  gameId: number,
  name: string,
  signal?: AbortSignal,
): Promise<Game> {
  return request(`${gamesPath(code)}/${gameId}`, {
    method: 'PATCH',
    body: { name },
    schema: gameSchema,
    signal,
  })
}

export function setGameVisibility(
  code: string,
  gameId: number,
  visible: boolean,
  signal?: AbortSignal,
): Promise<Game> {
  return request(`${gamesPath(code)}/${gameId}/visibility`, {
    method: 'PATCH',
    body: { visible },
    schema: gameSchema,
    signal,
  })
}

export function deleteGame(
  code: string,
  gameId: number,
  signal?: AbortSignal,
): Promise<void> {
  return requestEmpty(`${gamesPath(code)}/${gameId}`, {
    method: 'DELETE',
    signal,
  })
}
