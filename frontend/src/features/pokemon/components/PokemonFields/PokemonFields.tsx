import type { JSX } from 'react'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import type { MessageKey } from '../../../../shared/i18n/messages/pt-BR.ts'
import type { Game } from '../../../games/game.schema.ts'
import { SpritePreview } from '../AddPokemonModal/SpritePreview.tsx'
import { FormSelect } from '../AddPokemonModal/FormSelect.tsx'
import { genderOptions } from '../../usePokemonForm.ts'
import type { PokemonForm } from '../../usePokemonForm.ts'
import type { PokemonGender } from '../../pokemon.schema.ts'
import styles from '../AddPokemonModal/AddPokemonModal.module.css'

type PokemonFieldsProps = {
  form: PokemonForm
  games: readonly Game[]
  autoFocusName?: boolean
}

const genderKeys: Readonly<Record<PokemonGender, MessageKey>> = {
  male: 'pokemon.gender.male',
  female: 'pokemon.gender.female',
  genderless: 'pokemon.gender.genderless',
}

export function PokemonFields({
  form,
  games,
  autoFocusName = false,
}: PokemonFieldsProps): JSX.Element {
  const { t } = useI18n()

  return (
    <>
      <SpritePreview
        name={form.values.pokemonName}
        form={form.values.form}
        shiny={form.values.isShiny}
      />

      <label className={styles.field}>
        {t('addPokemon.name')}
        <input
          className={styles.input}
          value={form.values.pokemonName}
          onChange={(event) => {
            form.setField('pokemonName', event.target.value)
            form.setField('form', '')
          }}
          autoFocus={autoFocusName}
          autoComplete="off"
          required
        />
      </label>

      <label className={styles.field}>
        {t('addPokemon.nickname')}
        <input
          className={styles.input}
          value={form.values.nickname}
          onChange={(event) => {
            form.setField('nickname', event.target.value)
          }}
          autoComplete="off"
        />
      </label>

      <FormSelect
        name={form.values.pokemonName}
        value={form.values.form}
        onChange={(value) => {
          form.setField('form', value)
        }}
      />

      <label className={styles.field}>
        {t('pokemon.gender')}
        <select
          className={styles.select}
          value={form.values.gender}
          onChange={(event) => {
            form.setField('gender', asGender(event.target.value))
          }}
        >
          {genderOptions().map((gender) => (
            <option key={gender} value={gender}>
              {t(genderKeys[gender])}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        {t('pokemon.game')}
        {games.length === 0 ? (
          <p className={styles.hint}>{t('addPokemon.noVisibleGames')}</p>
        ) : (
          <select
            className={styles.select}
            value={form.values.gameId}
            onChange={(event) => {
              form.setField('gameId', Number(event.target.value))
            }}
          >
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
        )}
      </label>

      <label className={styles.checkboxField}>
        <input
          className={styles.checkbox}
          type="checkbox"
          checked={form.values.isShiny}
          onChange={(event) => {
            form.setField('isShiny', event.target.checked)
          }}
        />
        {t('pokemon.shiny')}
      </label>
    </>
  )
}

function asGender(value: string): PokemonGender {
  const found = genderOptions().find((gender) => gender === value)

  return found ?? 'male'
}
