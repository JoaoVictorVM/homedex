import { describe, expect, it } from 'vitest'
import { neighborSlot, parseSlotId, resolveDrop, slotId } from './dnd.ts'
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

describe('neighborSlot', () => {
  it('anda pela grade 6x5 com as setas', () => {
    expect(neighborSlot(7, 'ArrowRight')).toBe(8)
    expect(neighborSlot(7, 'ArrowLeft')).toBe(6)
    expect(neighborSlot(7, 'ArrowDown')).toBe(13)
    expect(neighborSlot(7, 'ArrowUp')).toBe(1)
  })

  it('não sai da linha ao chegar nas bordas laterais', () => {
    expect(neighborSlot(5, 'ArrowRight')).toBeNull()
    expect(neighborSlot(6, 'ArrowLeft')).toBeNull()
  })

  it('não sai da grade em cima ou embaixo', () => {
    expect(neighborSlot(2, 'ArrowUp')).toBeNull()
    expect(neighborSlot(27, 'ArrowDown')).toBeNull()
  })

  it('ignora teclas que não são setas', () => {
    expect(neighborSlot(7, 'Enter')).toBeNull()
  })
})
