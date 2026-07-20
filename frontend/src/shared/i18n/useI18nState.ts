import { useCallback, useMemo, useState } from 'react'
import type { I18nContextValue, Locale, TranslateParams } from './context.ts'
import { ptBR } from './messages/pt-BR.ts'
import type { MessageKey } from './messages/pt-BR.ts'
import { en } from './messages/en.ts'

const storageKey = 'homedex.locale'

const messagesByLocale: Readonly<
  Record<Locale, Readonly<Record<MessageKey, string>>>
> = {
  'pt-BR': ptBR,
  en,
}

function isLocale(value: string | null): value is Locale {
  return value === 'pt-BR' || value === 'en'
}

function detectLocale(): Locale {
  const stored = localStorage.getItem(storageKey)
  if (isLocale(stored)) {
    return stored
  }
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en'
}

export function useI18nState(): I18nContextValue {
  const [locale, setLocaleState] = useState<Locale>(detectLocale)

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(storageKey, next)
    setLocaleState(next)
  }, [])

  const t = useCallback(
    (key: MessageKey, params?: TranslateParams): string => {
      const message = messagesByLocale[locale][key]
      if (params === undefined) {
        return message
      }
      return Object.entries(params).reduce(
        (result, [name, value]) =>
          result.replaceAll(`{${name}}`, String(value)),
        message,
      )
    },
    [locale],
  )

  return useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])
}
