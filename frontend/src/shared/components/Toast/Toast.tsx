import { useEffect } from 'react'
import type { JSX } from 'react'
import { useI18n } from '../../i18n/useI18n.ts'
import styles from './Toast.module.css'

const autoDismissMs = 4000

type ToastProps = {
  message: string
  onDismiss: () => void
}

export function Toast({ message, onDismiss }: ToastProps): JSX.Element {
  const { t } = useI18n()

  useEffect(() => {
    const timer = setTimeout(onDismiss, autoDismissMs)

    return () => {
      clearTimeout(timer)
    }
  }, [onDismiss])

  return (
    <div className={styles.toast} role="alert">
      <span>{message}</span>
      <button
        className={styles.dismiss}
        type="button"
        aria-label={t('common.close')}
        onClick={onDismiss}
      >
        {'X'}
      </button>
    </div>
  )
}
