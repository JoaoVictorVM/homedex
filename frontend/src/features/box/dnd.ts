import type { UniqueIdentifier } from '@dnd-kit/core'

const prefix = 'slot-'

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
