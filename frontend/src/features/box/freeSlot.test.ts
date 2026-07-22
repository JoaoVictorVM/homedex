import { describe, expect, it } from 'vitest'
import { firstFreeSlot } from './freeSlot.ts'
import type { Pokemon } from '../pokemon/pokemon.schema.ts'

function ocupando(slots: number[]): Pokemon[] {
  return slots.map((slot, index) => ({
    id: index + 1,
    pokemonName: 'bulbasaur',
    nickname: '',
    isShiny: false,
    gender: 'male',
    form: '',
    gameId: 1,
    boxNumber: 1,
    slot,
    sprite: '',
  }))
}

describe('firstFreeSlot', () => {
  it('começa no primeiro slot da box vazia', () => {
    expect(firstFreeSlot([])).toBe(0)
  })

  it('escolhe o primeiro buraco disponível', () => {
    expect(firstFreeSlot(ocupando([0, 1, 3]))).toBe(2)
  })

  it('segue a sequência quando não há buracos', () => {
    expect(firstFreeSlot(ocupando([0, 1, 2]))).toBe(3)
  })

  it('não encontra slot em box cheia', () => {
    const todos = Array.from({ length: 30 }, (_, index) => index)

    expect(firstFreeSlot(ocupando(todos))).toBeNull()
  })
})
