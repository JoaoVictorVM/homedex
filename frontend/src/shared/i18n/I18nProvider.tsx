import type { JSX, ReactNode } from 'react'
import { I18nContext } from './context.ts'
import { useI18nState } from './useI18nState.ts'

export function I18nProvider({
  children,
}: {
  children: ReactNode
}): JSX.Element {
  const value = useI18nState()

  return <I18nContext value={value}>{children}</I18nContext>
}
