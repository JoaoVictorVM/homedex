import { createContext } from 'react'
import type { MessageKey } from './messages/pt-BR.ts'

export type Locale = 'pt-BR' | 'en'

export type TranslateParams = Readonly<Record<string, string | number>>

export type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey, params?: TranslateParams) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)
