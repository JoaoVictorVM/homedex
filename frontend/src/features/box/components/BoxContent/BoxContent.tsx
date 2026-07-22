import type { JSX } from 'react'
import { BoxGrid } from '../BoxGrid/BoxGrid.tsx'
import { useBoxPokemons } from '../../useBoxPokemons.ts'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import styles from './BoxContent.module.css'

type BoxContentProps = {
  code: string
  boxNumber: number
}

export function BoxContent({ code, boxNumber }: BoxContentProps): JSX.Element {
  const { t } = useI18n()
  const pokemons = useBoxPokemons(code, boxNumber)

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

  return <BoxGrid pokemons={pokemons.data} />
}
