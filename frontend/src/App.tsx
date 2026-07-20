import type { JSX } from 'react'
import { useI18n } from './shared/i18n/useI18n.ts'

export function App(): JSX.Element {
  const { t } = useI18n()

  return <h1>{t('app.title')}</h1>
}
