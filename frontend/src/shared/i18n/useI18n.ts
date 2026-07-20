import { useContext } from 'react'
import { I18nContext } from './context.ts'
import type { I18nContextValue } from './context.ts'

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext)

  if (value === null) {
    throw new Error('useI18n deve ser usado dentro de I18nProvider')
  }

  return value
}
