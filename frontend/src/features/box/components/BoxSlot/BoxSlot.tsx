import type { JSX } from 'react'
import type { Pokemon } from '../../../pokemon/pokemon.schema.ts'
import { spriteSlotSize } from '../../../../shared/spriteSizes.ts'
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
  const classes = [
    styles.slot,
    pokemon?.isShiny === true ? styles.shiny : '',
    isSelected ? styles.selected : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li className={classes} data-slot={slot}>
      {pokemon !== undefined && (
        <button
          className={styles.button}
          type="button"
          aria-label={displayName(pokemon)}
          aria-pressed={isSelected}
          onClick={() => {
            onSelect?.(slot)
          }}
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
