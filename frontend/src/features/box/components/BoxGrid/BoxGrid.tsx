import type { JSX } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { BoxSlot } from '../BoxSlot/BoxSlot.tsx'
import { slotsPerBox } from '../../../pokemon/pokemon.schema.ts'
import type { Pokemon } from '../../../pokemon/pokemon.schema.ts'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import { resolveDrop } from '../../dnd.ts'
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
  )

  function handleDragEnd(event: DragEndEvent): void {
    const move = resolveDrop(event)

    if (move !== null) {
      onMove?.(move.from, move.to)
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
