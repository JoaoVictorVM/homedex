import type { FormEvent, JSX } from 'react'
import { Modal } from '../../../../shared/components/Modal/Modal.tsx'
import { Button } from '../../../../shared/components/Button/Button.tsx'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import { useGames } from '../../../games/useGames.ts'
import { visibleGames } from '../../../games/visibleGames.ts'
import { useBoxPokemons } from '../../../box/useBoxPokemons.ts'
import { firstFreeSlot } from '../../../box/freeSlot.ts'
import { useAddPokemon } from '../../useAddPokemon.ts'
import { emptyAttributes, usePokemonForm } from '../../usePokemonForm.ts'
import { PokemonFields } from '../PokemonFields/PokemonFields.tsx'
import styles from './AddPokemonModal.module.css'

type AddPokemonModalProps = {
  code: string
  boxNumber: number
  onClose: () => void
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
  const form = usePokemonForm(emptyAttributes(firstGameId), firstGameId)
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

        <PokemonFields form={form} games={selectableGames} autoFocusName />

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
