import type { FormEvent, JSX } from 'react'
import { Modal } from '../../../../shared/components/Modal/Modal.tsx'
import { Button } from '../../../../shared/components/Button/Button.tsx'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import { useGames } from '../../../games/useGames.ts'
import { visibleGames } from '../../../games/visibleGames.ts'
import { useEditPokemon } from '../../useEditPokemon.ts'
import { usePokemonForm } from '../../usePokemonForm.ts'
import { PokemonFields } from '../PokemonFields/PokemonFields.tsx'
import type { Pokemon } from '../../pokemon.schema.ts'
import type { Game } from '../../../games/game.schema.ts'
import styles from '../AddPokemonModal/AddPokemonModal.module.css'

type EditPokemonModalProps = {
  code: string
  boxNumber: number
  pokemon: Pokemon
  onClose: () => void
}

export function EditPokemonModal({
  code,
  boxNumber,
  pokemon,
  onClose,
}: EditPokemonModalProps): JSX.Element {
  const { t } = useI18n()
  const games = useGames(code)
  const allGames = games.data ?? []
  const selectableGames = withCurrent(
    visibleGames(allGames),
    allGames.find((game) => game.id === pokemon.gameId),
  )
  const form = usePokemonForm(
    {
      pokemonName: pokemon.pokemonName,
      nickname: pokemon.nickname,
      isShiny: pokemon.isShiny,
      gender: pokemon.gender,
      form: pokemon.form,
      gameId: pokemon.gameId,
    },
    pokemon.gameId,
  )
  const editPokemon = useEditPokemon(code, boxNumber, pokemon.id, onClose)

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    editPokemon.mutate(form.values)
  }

  const blocked = !form.canSubmit || editPokemon.isPending

  return (
    <Modal title={t('editPokemon.title')} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        {editPokemon.error !== null && (
          <p className={styles.error} role="alert">
            {editPokemon.error.message}
          </p>
        )}

        <PokemonFields form={form} games={selectableGames} autoFocusName />

        <div className={styles.actions}>
          <Button type="submit" disabled={blocked}>
            {editPokemon.isPending
              ? t('common.loading')
              : t('editPokemon.submit')}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function withCurrent(
  games: ReturnType<typeof visibleGames>,
  current: Game | undefined,
): Game[] {
  if (current === undefined || games.some((game) => game.id === current.id)) {
    return games
  }

  return [current, ...games]
}
