import { useState } from 'react'
import type { JSX } from 'react'
import { BoxGrid } from '../BoxGrid/BoxGrid.tsx'
import { useBoxPokemons } from '../../useBoxPokemons.ts'
import { useMovePokemon } from '../../../pokemon/useMovePokemon.ts'
import { Toast } from '../../../../shared/components/Toast/Toast.tsx'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import styles from './BoxContent.module.css'

type BoxContentProps = {
  code: string
  boxNumber: number
  selectedSlot?: number | null
  onSelect?: (slot: number) => void
}

export function BoxContent({
  code,
  boxNumber,
  selectedSlot = null,
  onSelect,
}: BoxContentProps): JSX.Element {
  const { t } = useI18n()
  const [moveFailed, setMoveFailed] = useState(false)
  const pokemons = useBoxPokemons(code, boxNumber)
  const move = useMovePokemon(code, boxNumber, () => {
    setMoveFailed(true)
  })

  function handleMove(from: number, to: number): void {
    const dragged = pokemons.data?.find((pokemon) => pokemon.slot === from)

    if (dragged === undefined) {
      return
    }

    move.mutate({ pokemonId: dragged.id, slot: to })
  }

  if (pokemons.isLoading) {
    return (
      <p className={styles.message} role="status">
        {t('common.loading')}
      </p>
    )
  }

  if (pokemons.data === undefined) {
    return (
      <p className={styles.message} role="alert">
        {t('box.loadError')}
      </p>
    )
  }

  return (
    <>
      <BoxGrid
        pokemons={pokemons.data}
        selectedSlot={selectedSlot}
        onSelect={onSelect}
        onMove={handleMove}
      />
      {moveFailed && (
        <Toast
          message={t('box.moveError')}
          onDismiss={() => {
            setMoveFailed(false)
          }}
        />
      )}
    </>
  )
}
