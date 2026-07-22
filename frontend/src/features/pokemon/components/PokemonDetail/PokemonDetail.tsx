import type { JSX } from 'react'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import type { MessageKey } from '../../../../shared/i18n/messages/pt-BR.ts'
import { useGames } from '../../../games/useGames.ts'
import { useBoxPokemons } from '../../../box/useBoxPokemons.ts'
import { spriteDetailSize } from '../../../../shared/spriteSizes.ts'
import type { Pokemon, PokemonGender } from '../../pokemon.schema.ts'
import styles from './PokemonDetail.module.css'

type PokemonDetailProps = {
  code: string
  boxNumber: number
  slot: number | null
}

const genderKeys: Readonly<Record<PokemonGender, MessageKey>> = {
  male: 'pokemon.gender.male',
  female: 'pokemon.gender.female',
  genderless: 'pokemon.gender.genderless',
}

const genderStyles: Readonly<Record<PokemonGender, string>> = {
  male: styles.male ?? '',
  female: styles.female ?? '',
  genderless: '',
}

export function PokemonDetail({
  code,
  boxNumber,
  slot,
}: PokemonDetailProps): JSX.Element {
  const { t } = useI18n()
  const pokemons = useBoxPokemons(code, boxNumber)
  const games = useGames(code)

  const selected = pokemons.data?.find((pokemon) => pokemon.slot === slot)

  if (selected === undefined) {
    return <p className={styles.empty}>{t('pokemon.noneSelected')}</p>
  }

  const gameName = games.data?.find((game) => game.id === selected.gameId)?.name

  return (
    <article className={styles.detail}>
      {selected.sprite === '' ? (
        <div className={styles.spriteFallback}>{t('pokemon.noSprite')}</div>
      ) : (
        <img
          className={styles.sprite}
          src={selected.sprite}
          alt={displayName(selected)}
          width={spriteDetailSize}
          height={spriteDetailSize}
          decoding="async"
        />
      )}

      <div>
        <h2 className={styles.name}>{displayName(selected)}</h2>
        {selected.nickname !== '' && (
          <p className={styles.species}>{selected.pokemonName}</p>
        )}
      </div>

      <dl className={styles.attributes}>
        <div className={styles.row}>
          <dt className={styles.label}>{t('pokemon.gender')}</dt>
          <dd className={`${styles.value} ${genderStyles[selected.gender]}`}>
            {t(genderKeys[selected.gender])}
          </dd>
        </div>

        <div className={styles.row}>
          <dt className={styles.label}>{t('pokemon.shiny')}</dt>
          <dd
            className={`${styles.value} ${selected.isShiny ? styles.shiny : ''}`}
          >
            {t(selected.isShiny ? 'common.yes' : 'common.no')}
          </dd>
        </div>

        {selected.form !== '' && (
          <div className={styles.row}>
            <dt className={styles.label}>{t('pokemon.form')}</dt>
            <dd className={styles.value}>{selected.form}</dd>
          </div>
        )}

        <div className={styles.row}>
          <dt className={styles.label}>{t('pokemon.game')}</dt>
          <dd className={styles.value}>{gameName ?? '—'}</dd>
        </div>
      </dl>
    </article>
  )
}

function displayName(pokemon: Pokemon): string {
  return pokemon.nickname === '' ? pokemon.pokemonName : pokemon.nickname
}
