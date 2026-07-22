import type { JSX, ReactNode } from 'react'
import { Button } from '../../../../shared/components/Button/Button.tsx'
import { CollectionCode } from '../../../collection/components/CollectionCode/CollectionCode.tsx'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import styles from './BoxScreen.module.css'

type BoxScreenProps = {
  code: string
  onLeave: () => void
  onAddPokemon?: () => void
  onOpenGames?: () => void
  detail?: ReactNode
  box?: ReactNode
}

export function BoxScreen({
  code,
  onLeave,
  onAddPokemon,
  onOpenGames,
  detail,
  box,
}: BoxScreenProps): JSX.Element {
  const { t } = useI18n()

  return (
    <div className={styles.screen}>
      <header className={styles.topBar}>
        <div className={styles.actions}>
          <Button onClick={onAddPokemon} disabled={onAddPokemon === undefined}>
            {t('box.addPokemon')}
          </Button>
          <Button
            variant="secondary"
            onClick={onOpenGames}
            disabled={onOpenGames === undefined}
          >
            {t('box.games')}
          </Button>
        </div>
        <div className={styles.session}>
          <CollectionCode code={code} />
          <Button variant="secondary" onClick={onLeave}>
            {t('collection.leave')}
          </Button>
        </div>
      </header>

      <main className={styles.content}>
        <aside className={styles.sidePanel} aria-label={t('box.detailPanel')}>
          {detail}
        </aside>
        <section className={styles.boxArea} aria-label={t('box.boxArea')}>
          {box}
        </section>
      </main>
    </div>
  )
}
