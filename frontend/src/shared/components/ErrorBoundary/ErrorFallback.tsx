import type { JSX } from 'react'
import { Button } from '../Button/Button.tsx'
import { useI18n } from '../../i18n/useI18n.ts'
import styles from './ErrorFallback.module.css'

export function ErrorFallback({
  onReload,
}: {
  onReload: () => void
}): JSX.Element {
  const { t } = useI18n()

  return (
    <main className={styles.screen}>
      <div className={styles.panel} role="alert">
        <h1 className={styles.title}>{t('error.title')}</h1>
        <p className={styles.message}>{t('error.message')}</p>
        <Button onClick={onReload}>{t('error.reload')}</Button>
      </div>
    </main>
  )
}
