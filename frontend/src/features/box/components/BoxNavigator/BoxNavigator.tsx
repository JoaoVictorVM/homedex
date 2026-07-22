import type { JSX } from 'react'
import { Button } from '../../../../shared/components/Button/Button.tsx'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import { boxRange, nextBox, previousBox } from '../../boxRange.ts'
import styles from './BoxNavigator.module.css'

type BoxNavigatorProps = {
  boxNumber: number
  boxCount: number
  onChange: (boxNumber: number) => void
}

export function BoxNavigator({
  boxNumber,
  boxCount,
  onChange,
}: BoxNavigatorProps): JSX.Element {
  const { t } = useI18n()
  const range = boxRange(boxNumber)
  const single = boxCount <= 1

  return (
    <nav className={styles.navigator} aria-label={t('box.navigation')}>
      <Button
        className={styles.arrow}
        variant="secondary"
        aria-label={t('box.previous')}
        disabled={single}
        onClick={() => {
          onChange(previousBox(boxNumber, boxCount))
        }}
      >
        {'<'}
      </Button>

      <div className={styles.info}>
        <strong className={styles.title}>
          {t('box.title', { number: boxNumber })}
        </strong>
        <span className={styles.range}>
          {t('box.range', { first: range.first, last: range.last })}
        </span>
      </div>

      <Button
        className={styles.arrow}
        variant="secondary"
        aria-label={t('box.next')}
        disabled={single}
        onClick={() => {
          onChange(nextBox(boxNumber, boxCount))
        }}
      >
        {'>'}
      </Button>
    </nav>
  )
}
