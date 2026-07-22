import type { JSX } from 'react'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import { formatCode } from '../../code.ts'
import styles from './CollectionCode.module.css'

export function CollectionCode({ code }: { code: string }): JSX.Element {
  const { t } = useI18n()

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{t('collection.codeLabel')}</span>
      <strong className={styles.code}>{formatCode(code)}</strong>
    </div>
  )
}
