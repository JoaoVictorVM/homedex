import type { KeyboardCoordinateGetter, UniqueIdentifier } from '@dnd-kit/core'
import { slotsPerBox } from '../pokemon/pokemon.schema.ts'

const prefix = 'slot-'
const columns = 6

export type DropEvent = {
  active: { id: UniqueIdentifier }
  over: { id: UniqueIdentifier } | null
}

export function slotId(slot: number): string {
  return `${prefix}${slot}`
}

export function parseSlotId(id: string | number): number | null {
  if (typeof id !== 'string' || !id.startsWith(prefix)) {
    return null
  }

  const slot = Number(id.slice(prefix.length))

  return Number.isInteger(slot) ? slot : null
}

export type Move = {
  from: number
  to: number
}

export function resolveDrop(event: DropEvent): Move | null {
  if (event.over === null) {
    return null
  }

  const from = parseSlotId(event.active.id)
  const to = parseSlotId(event.over.id)

  if (from === null || to === null || from === to) {
    return null
  }

  return { from, to }
}

export function neighborSlot(slot: number, code: string): number | null {
  const column = slot % columns

  switch (code) {
    case 'ArrowRight':
      return column < columns - 1 ? slot + 1 : null
    case 'ArrowLeft':
      return column > 0 ? slot - 1 : null
    case 'ArrowDown':
      return slot + columns < slotsPerBox ? slot + columns : null
    case 'ArrowUp':
      return slot - columns >= 0 ? slot - columns : null
    default:
      return null
  }
}

export const gridCoordinateGetter: KeyboardCoordinateGetter = (
  event,
  { active, context },
) => {
  const activeSlot = parseSlotId(active)
  if (activeSlot === null) {
    return undefined
  }

  const overSlot = context.over === null ? null : parseSlotId(context.over.id)
  const target = neighborSlot(overSlot ?? activeSlot, event.code)
  if (target === null) {
    return undefined
  }

  const rect = context.droppableRects.get(slotId(target))
  if (rect === undefined) {
    return undefined
  }

  event.preventDefault()

  return { x: rect.left, y: rect.top }
}
