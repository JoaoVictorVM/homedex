import { useEffect, useId } from 'react'
import type { JSX, ReactNode } from 'react'
import { useI18n } from '../../i18n/useI18n.ts'
import styles from './Modal.module.css'

type ModalProps = {
  title: string
  children: ReactNode
  onClose?: () => void
}

export function Modal({ title, children, onClose }: ModalProps): JSX.Element {
  const { t } = useI18n()
  const titleId = useId()

  useEffect(() => {
    if (onClose === undefined) {
      return
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div className={styles.overlay}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={styles.header}>
          <h2 className={styles.title} id={titleId}>
            {title}
          </h2>
          {onClose !== undefined && (
            <button
              className={styles.close}
              type="button"
              aria-label={t('common.close')}
              onClick={onClose}
            >
              {'X'}
            </button>
          )}
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
