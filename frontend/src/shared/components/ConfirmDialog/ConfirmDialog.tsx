import type { JSX } from 'react'
import { Modal } from '../Modal/Modal.tsx'
import { Button } from '../Button/Button.tsx'
import { useI18n } from '../../i18n/useI18n.ts'
import styles from './ConfirmDialog.module.css'

type ConfirmDialogProps = {
  title: string
  message: string
  confirmLabel: string
  errorMessage?: string
  isPending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  errorMessage,
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): JSX.Element {
  const { t } = useI18n()

  return (
    <Modal title={title} onClose={onCancel}>
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
        {errorMessage !== undefined && (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        )}
        <div className={styles.actions}>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? t('common.loading') : confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={isPending}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
