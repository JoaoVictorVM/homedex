import { describe, expect, it } from 'vitest'
import { applyMove } from './applyMove.ts'
import type { Pokemon } from '../pokemon/pokemon.schema.ts'

function pokemon(id: number, slot: number): Pokemon {
  return {
    id,
    pokemonName: 'bulbasaur',
    nickname: '',
    isShiny: false,
    gender: 'male',
    form: '',
    gameId: 1,
    boxNumber: 1,
    slot,
    sprite: '',
  }
}

function slotById(list: Pokemon[]): Record<number, number> {
  return Object.fromEntries(list.map((p) => [p.id, p.slot]))
}

describe('applyMove', () => {
  it('move para um slot vazio', () => {
    const result = applyMove([pokemon(1, 0)], 1, 5)

    expect(slotById(result)).toEqual({ 1: 5 })
  })

  it('troca de lugar quando o destino está ocupado', () => {
    const result = applyMove([pokemon(1, 0), pokemon(2, 5)], 1, 5)

    expect(slotById(result)).toEqual({ 1: 5, 2: 0 })
  })

  it('não altera nada ao soltar no próprio slot', () => {
    const before = [pokemon(1, 0), pokemon(2, 5)]
    const result = applyMove(before, 1, 0)

    expect(slotById(result)).toEqual({ 1: 0, 2: 5 })
  })

  it('ignora pokémon inexistente', () => {
    const result = applyMove([pokemon(1, 0)], 99, 5)

    expect(slotById(result)).toEqual({ 1: 0 })
  })

  it('não muta a lista original', () => {
    const before = [pokemon(1, 0), pokemon(2, 5)]
    applyMove(before, 1, 5)

    expect(slotById(before)).toEqual({ 1: 0, 2: 5 })
  })
})
