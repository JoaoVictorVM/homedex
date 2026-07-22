import type { JSX } from 'react'
import { Button } from '../../../../shared/components/Button/Button.tsx'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import { boxRange, nextBox, previousBox } from '../../boxRange.ts'
import { maxBoxes } from '../../../collection/collection.schema.ts'
import styles from './BoxNavigator.module.css'

type BoxNavigatorProps = {
  boxNumber: number
  boxCount: number
  onChange: (boxNumber: number) => void
  onAddBox?: () => void
  isAddingBox?: boolean
}

export function BoxNavigator({
  boxNumber,
  boxCount,
  onChange,
  onAddBox,
  isAddingBox = false,
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

      {onAddBox !== undefined && (
        <Button
          className={styles.addBox}
          onClick={onAddBox}
          disabled={isAddingBox || boxCount >= maxBoxes}
        >
          {t('box.addBox')}
        </Button>
      )}
    </nav>
  )
}
