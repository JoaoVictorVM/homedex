import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { JSX, ReactNode } from 'react'
import { I18nProvider } from './I18nProvider.tsx'
import { useI18n } from './useI18n.ts'

function wrapper({ children }: { children: ReactNode }): JSX.Element {
  return <I18nProvider>{children}</I18nProvider>
}

describe('useI18n', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('usa en como locale padrão fora de navegador pt', () => {
    const { result } = renderHook(() => useI18n(), { wrapper })

    expect(result.current.locale).toBe('en')
    expect(result.current.t('games.title')).toBe('Games')
  })

  it('troca de locale, traduz e persiste a escolha', () => {
    const { result } = renderHook(() => useI18n(), { wrapper })

    act(() => {
      result.current.setLocale('pt-BR')
    })

    expect(result.current.locale).toBe('pt-BR')
    expect(result.current.t('games.title')).toBe('Jogos')
    expect(localStorage.getItem('homedex.locale')).toBe('pt-BR')
  })

  it('usa o locale salvo no localStorage', () => {
    localStorage.setItem('homedex.locale', 'pt-BR')

    const { result } = renderHook(() => useI18n(), { wrapper })

    expect(result.current.locale).toBe('pt-BR')
  })

  it('interpola parâmetros na mensagem', () => {
    const { result } = renderHook(() => useI18n(), { wrapper })

    expect(result.current.t('box.title', { number: 3 })).toBe('Box 3')
  })

  it('dispara erro quando usado fora do provider', () => {
    expect(() => renderHook(() => useI18n())).toThrow(
      'useI18n deve ser usado dentro de I18nProvider',
    )
  })
})
