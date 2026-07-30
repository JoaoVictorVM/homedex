import { describe, expect, it } from 'vitest'
import { visibleGames } from './visibleGames.ts'
import type { Game } from './game.schema.ts'

function game(overrides: Partial<Game> = {}): Game {
  return {
    id: 1,
    name: 'FireRed',
    isOfficial: true,
    isSystem: false,
    visible: true,
    ...overrides,
  }
}

describe('visibleGames', () => {
  it('mantém só os jogos visíveis', () => {
    const result = visibleGames([
      game({ id: 1, visible: true }),
      game({ id: 2, visible: false }),
      game({ id: 3, visible: true }),
    ])

    expect(result.map((g) => g.id)).toEqual([1, 3])
  })

  it('preserva a ordem original', () => {
    const result = visibleGames([
      game({ id: 5, name: 'Red' }),
      game({ id: 9, name: 'Blue' }),
    ])

    expect(result.map((g) => g.name)).toEqual(['Red', 'Blue'])
  })

  it('devolve vazio quando nada está visível', () => {
    expect(visibleGames([game({ visible: false })])).toEqual([])
  })

  it('esconde o jogo do sistema mesmo quando visível', () => {
    const result = visibleGames([
      game({ id: 1, name: 'FireRed' }),
      game({ id: 2, name: 'HomeDex', isSystem: true, visible: true }),
    ])

    expect(result.map((g) => g.name)).toEqual(['FireRed'])
  })
})
