import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { withProviders } from '../../../test/renderWithProviders.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'

function Boom(): never {
  throw new Error('estourou')
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza o conteúdo quando não há erro', () => {
    render(
      withProviders(
        <ErrorBoundary>
          <p>tudo certo</p>
        </ErrorBoundary>,
      ),
    )

    expect(screen.getByText('tudo certo')).toBeInTheDocument()
  })

  it('mostra a tela de erro quando um filho quebra', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      withProviders(
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>,
      ),
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i)
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()
  })

  it('recarrega ao clicar em recarregar', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const reload = vi.fn()
    vi.stubGlobal('location', { reload })

    render(
      withProviders(
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>,
      ),
    )

    await userEvent.click(screen.getByRole('button', { name: /reload/i }))

    expect(reload).toHaveBeenCalledOnce()
    vi.unstubAllGlobals()
  })
})
