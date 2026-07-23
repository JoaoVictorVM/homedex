import type { JSX } from 'react'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import { spriteDetailSize } from '../../../../shared/spriteSizes.ts'
import { useSpritePreview } from '../../useSpritePreview.ts'
import styles from './SpritePreview.module.css'

type SpritePreviewProps = {
  name: string
  form: string
  shiny: boolean
}

export function SpritePreview({
  name,
  form,
  shiny,
}: SpritePreviewProps): JSX.Element {
  const { t } = useI18n()
  const preview = useSpritePreview(name, form, shiny)

  return (
    <div className={styles.preview} aria-live="polite">
      {content()}
    </div>
  )

  function content(): JSX.Element {
    if (name.trim() === '') {
      return <span className={styles.message}>{t('addPokemon.typeName')}</span>
    }

    if (preview.isSuccess && preview.data !== '') {
      return (
        <img
          className={styles.sprite}
          src={preview.data}
          alt={t('addPokemon.spritePreview')}
          width={spriteDetailSize}
          height={spriteDetailSize}
          decoding="async"
        />
      )
    }

    if (preview.isError || (preview.isSuccess && preview.data === '')) {
      return (
        <span className={styles.message}>{t('addPokemon.spriteNotFound')}</span>
      )
    }

    return <span className={styles.message}>{t('common.loading')}</span>
  }
}
