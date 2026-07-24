import type { JSX } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { Announcements, DragEndEvent } from '@dnd-kit/core'
import { BoxSlot } from '../BoxSlot/BoxSlot.tsx'
import { slotsPerBox } from '../../../pokemon/pokemon.schema.ts'
import type { Pokemon } from '../../../pokemon/pokemon.schema.ts'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import { gridCoordinateGetter, parseSlotId, resolveDrop } from '../../dnd.ts'
import styles from './BoxGrid.module.css'

type BoxGridProps = {
  pokemons: Pokemon[]
  selectedSlot?: number | null
  onSelect?: (slot: number) => void
  onMove?: (from: number, to: number) => void
}

const slots = Array.from({ length: slotsPerBox }, (_, index) => index)

export function BoxGrid({
  pokemons,
  selectedSlot = null,
  onSelect,
  onMove,
}: BoxGridProps): JSX.Element {
  const { t } = useI18n()
  const bySlot = new Map(pokemons.map((pokemon) => [pokemon.slot, pokemon]))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: gridCoordinateGetter }),
  )

  function slotNumber(id: string | number): number {
    return (parseSlotId(id) ?? -1) + 1
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      t('box.dnd.start', { slot: slotNumber(active.id) }),
    onDragOver: ({ over }) =>
      over === null
        ? undefined
        : t('box.dnd.over', { slot: slotNumber(over.id) }),
    onDragEnd: ({ over }) =>
      over === null
        ? t('box.dnd.cancelled')
        : t('box.dnd.dropped', { slot: slotNumber(over.id) }),
    onDragCancel: () => t('box.dnd.cancelled'),
  }

  function handleDragEnd(event: DragEndEvent): void {
    const move = resolveDrop(event)

    if (move !== null) {
      onMove?.(move.from, move.to)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
      accessibility={{ announcements }}
    >
      <ul className={styles.grid} aria-label={t('box.slots')}>
        {slots.map((slot) => (
          <BoxSlot
            key={slot}
            slot={slot}
            pokemon={bySlot.get(slot)}
            isSelected={slot === selectedSlot}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </DndContext>
  )
}
