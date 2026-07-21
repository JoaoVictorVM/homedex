import { describe, expect, it } from 'vitest'
import { gameListSchema, gameSchema } from './game.schema.ts'

const oficial = {
  id: 394,
  name: 'FireRed',
  isOfficial: true,
  visible: true,
}

const hackrom = {
  id: 471,
  name: 'Radical Red',
  isOfficial: false,
  visible: false,
}

describe('gameSchema', () => {
  it('aceita jogo oficial e hackrom', () => {
    expect(gameSchema.parse(oficial)).toEqual(oficial)
    expect(gameSchema.parse(hackrom)).toEqual(hackrom)
  })

  it('rejeita nome vazio e id inválido', () => {
    expect(gameSchema.safeParse({ ...oficial, name: '' }).success).toBe(false)
    expect(gameSchema.safeParse({ ...oficial, id: 0 }).success).toBe(false)
  })

  it('valida a lista de jogos da coleção', () => {
    expect(gameListSchema.parse([oficial, hackrom])).toHaveLength(2)
    expect(gameListSchema.safeParse([{ ...oficial, visible: 1 }]).success).toBe(
      false,
    )
  })
})
