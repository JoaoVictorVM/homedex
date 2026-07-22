import type { JSX } from 'react'
import { BoxSlot } from '../BoxSlot/BoxSlot.tsx'
import { slotsPerBox } from '../../../pokemon/pokemon.schema.ts'
import type { Pokemon } from '../../../pokemon/pokemon.schema.ts'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import styles from './BoxGrid.module.css'

type BoxGridProps = {
  pokemons: Pokemon[]
  selectedSlot?: number | null
  onSelect?: (slot: number) => void
}

const slots = Array.from({ length: slotsPerBox }, (_, index) => index)

export function BoxGrid({
  pokemons,
  selectedSlot = null,
  onSelect,
}: BoxGridProps): JSX.Element {
  const { t } = useI18n()
  const bySlot = new Map(pokemons.map((pokemon) => [pokemon.slot, pokemon]))

  return (
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
  )
}
