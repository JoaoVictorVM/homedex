import type { Game } from './game.schema.ts'

export function visibleGames(games: readonly Game[]): Game[] {
  return games.filter((game) => game.visible)
}
