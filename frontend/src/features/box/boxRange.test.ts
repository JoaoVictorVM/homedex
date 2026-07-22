import { describe, expect, it } from 'vitest'
import { boxRange, nextBox, previousBox } from './boxRange.ts'

describe('boxRange', () => {
  it('cobre os 30 primeiros na box 1', () => {
    expect(boxRange(1)).toEqual({ first: 1, last: 30 })
  })

  it('acompanha o deslocamento das boxes seguintes', () => {
    expect(boxRange(4)).toEqual({ first: 91, last: 120 })
    expect(boxRange(32)).toEqual({ first: 931, last: 960 })
  })
})

describe('nextBox', () => {
  it('avança até a última', () => {
    expect(nextBox(1, 3)).toBe(2)
    expect(nextBox(2, 3)).toBe(3)
  })

  it('volta para a primeira depois da última', () => {
    expect(nextBox(3, 3)).toBe(1)
  })

  it('permanece na única box existente', () => {
    expect(nextBox(1, 1)).toBe(1)
  })
})

describe('previousBox', () => {
  it('retrocede até a primeira', () => {
    expect(previousBox(3, 3)).toBe(2)
    expect(previousBox(2, 3)).toBe(1)
  })

  it('vai para a última antes da primeira', () => {
    expect(previousBox(1, 3)).toBe(3)
  })

  it('permanece na única box existente', () => {
    expect(previousBox(1, 1)).toBe(1)
  })
})
