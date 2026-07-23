import type { FormEvent, JSX } from 'react'
import { Modal } from '../../../../shared/components/Modal/Modal.tsx'
import { Button } from '../../../../shared/components/Button/Button.tsx'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import type { MessageKey } from '../../../../shared/i18n/messages/pt-BR.ts'
import { useGames } from '../../../games/useGames.ts'
import { visibleGames } from '../../../games/visibleGames.ts'
import { useBoxPokemons } from '../../../box/useBoxPokemons.ts'
import { firstFreeSlot } from '../../../box/freeSlot.ts'
import { useAddPokemon } from '../../useAddPokemon.ts'
import { SpritePreview } from './SpritePreview.tsx'
import { FormSelect } from './FormSelect.tsx'
import { genderOptions, useAddPokemonForm } from './useAddPokemonForm.ts'
import type { PokemonGender } from '../../pokemon.schema.ts'
import styles from './AddPokemonModal.module.css'

type AddPokemonModalProps = {
  code: string
  boxNumber: number
  onClose: () => void
}

const genderKeys: Readonly<Record<PokemonGender, MessageKey>> = {
  male: 'pokemon.gender.male',
  female: 'pokemon.gender.female',
  genderless: 'pokemon.gender.genderless',
}

export function AddPokemonModal({
  code,
  boxNumber,
  onClose,
}: AddPokemonModalProps): JSX.Element {
  const { t } = useI18n()
  const games = useGames(code)
  const pokemons = useBoxPokemons(code, boxNumber)
  const selectableGames = visibleGames(games.data ?? [])
  const firstGameId = selectableGames[0]?.id ?? 0
  const form = useAddPokemonForm(firstGameId)
  const addPokemon = useAddPokemon(code, boxNumber, onClose)
  const slot = firstFreeSlot(pokemons.data ?? [])

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    if (slot === null) {
      return
    }

    addPokemon.mutate({ ...form.values, boxNumber, slot })
  }

  const boxFull = slot === null
  const blocked = boxFull || !form.canSubmit || addPokemon.isPending

  return (
    <Modal title={t('addPokemon.title')} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        {boxFull && (
          <p className={styles.error} role="alert">
            {t('addPokemon.boxFull')}
          </p>
        )}
        {addPokemon.error !== null && (
          <p className={styles.error} role="alert">
            {addPokemon.error.message}
          </p>
        )}

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
            autoFocus
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
          {selectableGames.length === 0 ? (
            <p className={styles.hint}>{t('addPokemon.noVisibleGames')}</p>
          ) : (
            <select
              className={styles.select}
              value={form.values.gameId}
              onChange={(event) => {
                form.setField('gameId', Number(event.target.value))
              }}
            >
              {selectableGames.map((game) => (
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

        <div className={styles.actions}>
          <Button type="submit" disabled={blocked}>
            {addPokemon.isPending
              ? t('common.loading')
              : t('addPokemon.submit')}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function asGender(value: string): PokemonGender {
  const found = genderOptions().find((gender) => gender === value)

  return found ?? 'male'
}
