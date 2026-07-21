import type { FormEvent, JSX } from 'react'
import { Modal } from '../../../../shared/components/Modal/Modal.tsx'
import { Button } from '../../../../shared/components/Button/Button.tsx'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import { codeLength } from '../../code.ts'
import { useEntryModal } from './useEntryModal.ts'
import styles from './EntryModal.module.css'

type EntryModalProps = {
  onSubmitCode: (code: string) => void
  isLoading?: boolean
  onCreate?: () => void
}

export function EntryModal({
  onSubmitCode,
  isLoading = false,
  onCreate,
}: EntryModalProps): JSX.Element {
  const { t } = useI18n()
  const entry = useEntryModal(onSubmitCode)

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    entry.submitCode()
  }

  return (
    <Modal title={t('entry.title')}>
      <div className={styles.content}>
        {entry.step === 'choice' ? (
          <>
            <p className={styles.question}>{t('entry.question')}</p>
            <div className={styles.actions}>
              <Button onClick={entry.goToCodeStep}>{t('entry.hasCode')}</Button>
              {onCreate !== undefined && (
                <Button variant="secondary" onClick={onCreate}>
                  {t('entry.createNew')}
                </Button>
              )}
            </div>
          </>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label}>
              {t('entry.codeLabel')}
              <input
                className={styles.input}
                value={entry.code}
                onChange={(event) => {
                  entry.changeCode(event.target.value)
                }}
                maxLength={codeLength + 1}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                aria-label={t('entry.codeLabel')}
                disabled={isLoading}
              />
            </label>
            <p className={styles.hint}>{t('entry.codeHint')}</p>
            <div className={styles.actions}>
              <Button type="submit" disabled={!entry.canSubmit || isLoading}>
                {isLoading ? t('common.loading') : t('entry.confirm')}
              </Button>
              <Button
                variant="secondary"
                onClick={entry.goToChoiceStep}
                disabled={isLoading}
              >
                {t('entry.back')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
