import type { JSX } from 'react'
import { useI18n } from '../../i18n/useI18n.ts'
import styles from './LoadingScreen.module.css'

export function LoadingScreen(): JSX.Element {
  const { t } = useI18n()

  return (
    <div className={styles.screen} role="status" aria-live="polite">
      {t('common.loading')}
    </div>
  )
}
