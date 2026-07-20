import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App.tsx'
import { I18nProvider } from './shared/i18n/I18nProvider.tsx'

describe('App', () => {
  it('renderiza o título HomeDex', () => {
    render(
      <I18nProvider>
        <App />
      </I18nProvider>,
    )
    expect(screen.getByRole('heading', { name: 'HomeDex' })).toBeInTheDocument()
  })
})
