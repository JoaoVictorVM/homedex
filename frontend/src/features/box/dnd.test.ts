import { describe, expect, it } from 'vitest'
import { parseSlotId, resolveDrop, slotId } from './dnd.ts'
import type { DropEvent } from './dnd.ts'

function dragEnd(activeId: string, overId: string | null): DropEvent {
  return {
    active: { id: activeId },
    over: overId === null ? null : { id: overId },
  }
}

describe('slotId / parseSlotId', () => {
  it('faz o ida e volta do identificador do slot', () => {
    expect(slotId(5)).toBe('slot-5')
    expect(parseSlotId('slot-5')).toBe(5)
    expect(parseSlotId('slot-0')).toBe(0)
  })

  it('rejeita identificadores fora do padrão', () => {
    expect(parseSlotId('outro-5')).toBeNull()
    expect(parseSlotId('slot-x')).toBeNull()
    expect(parseSlotId(5)).toBeNull()
  })
})

describe('resolveDrop', () => {
  it('devolve a origem e o destino de um arraste válido', () => {
    expect(resolveDrop(dragEnd('slot-2', 'slot-7'))).toEqual({ from: 2, to: 7 })
  })

  it('ignora quando não há destino', () => {
    expect(resolveDrop(dragEnd('slot-2', null))).toBeNull()
  })

  it('ignora quando origem e destino são o mesmo slot', () => {
    expect(resolveDrop(dragEnd('slot-3', 'slot-3'))).toBeNull()
  })

  it('ignora identificadores inesperados', () => {
    expect(resolveDrop(dragEnd('lixo', 'slot-1'))).toBeNull()
  })
})
