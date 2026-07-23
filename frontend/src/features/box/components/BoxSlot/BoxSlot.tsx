import type { CSSProperties, JSX } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Pokemon } from '../../../pokemon/pokemon.schema.ts'
import { spriteSlotSize } from '../../../../shared/spriteSizes.ts'
import { slotId } from '../../dnd.ts'
import styles from './BoxSlot.module.css'

type BoxSlotProps = {
  slot: number
  pokemon?: Pokemon
  isSelected?: boolean
  onSelect?: (slot: number) => void
}

export function BoxSlot({
  slot,
  pokemon,
  isSelected = false,
  onSelect,
}: BoxSlotProps): JSX.Element {
  const id = slotId(slot)
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id })
  const {
    setNodeRef: setDragRef,
    listeners,
    attributes,
    transform,
    isDragging,
  } = useDraggable({ id, disabled: pokemon === undefined })

  const classes = [
    styles.slot,
    pokemon?.isShiny === true ? styles.shiny : '',
    isSelected ? styles.selected : '',
    isOver ? styles.over : '',
  ]
    .filter(Boolean)
    .join(' ')

  const buttonStyle: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 'var(--z-drag)' : undefined,
    opacity: isDragging ? 0.85 : undefined,
  }

  return (
    <li ref={setDropRef} className={classes} data-slot={slot}>
      {pokemon !== undefined && (
        <button
          ref={setDragRef}
          className={styles.button}
          type="button"
          style={buttonStyle}
          aria-label={displayName(pokemon)}
          aria-current={isSelected ? 'true' : undefined}
          onClick={() => {
            onSelect?.(slot)
          }}
          {...listeners}
          {...attributes}
        >
          {pokemon.sprite !== '' && (
            <img
              className={styles.sprite}
              src={pokemon.sprite}
              alt=""
              width={spriteSlotSize}
              height={spriteSlotSize}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          )}
        </button>
      )}
    </li>
  )
}

function displayName(pokemon: Pokemon): string {
  return pokemon.nickname === '' ? pokemon.pokemonName : pokemon.nickname
}
