import type { JSX } from 'react'
import type { Pokemon } from '../../../pokemon/pokemon.schema.ts'
import styles from './BoxSlot.module.css'

type BoxSlotProps = {
  slot: number
  pokemon?: Pokemon
}

export function BoxSlot({ slot, pokemon }: BoxSlotProps): JSX.Element {
  const classes = [styles.slot, pokemon?.isShiny === true ? styles.shiny : '']
    .filter(Boolean)
    .join(' ')

  return (
    <li className={classes} data-slot={slot}>
      {pokemon !== undefined && pokemon.sprite !== '' && (
        <img
          className={styles.sprite}
          src={pokemon.sprite}
          alt={displayName(pokemon)}
        />
      )}
    </li>
  )
}

function displayName(pokemon: Pokemon): string {
  return pokemon.nickname === '' ? pokemon.pokemonName : pokemon.nickname
}
