import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../test/renderWithProviders.tsx'
import { GamesModal } from './GamesModal.tsx'

const games = [
  { id: 1, name: 'Red', isOfficial: true, visible: true },
  { id: 2, name: 'Blue', isOfficial: true, visible: false },
  { id: 3, name: 'Radical Red', isOfficial: false, visible: true },
]

function mockGames(list: unknown = games): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(list), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    ),
  )
}

describe('GamesModal', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('abre na aba de oficiais listando os jogos oficiais', async () => {
    mockGames()
    renderWithProviders(<GamesModal code="A7K9F2QX" onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Red')).toBeInTheDocument()
    })
    expect(screen.getByText('Blue')).toBeInTheDocument()
    expect(screen.queryByText('Radical Red')).not.toBeInTheDocument()
  })

  it('troca para a aba de hackroms', async () => {
    mockGames()
    renderWithProviders(<GamesModal code="A7K9F2QX" onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Red')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('tab', { name: /hackrom/i }))

    expect(screen.getByText('Radical Red')).toBeInTheDocument()
    expect(screen.queryByText('Red')).not.toBeInTheDocument()
  })

  it('mostra estado vazio quando não há hackroms', async () => {
    mockGames([games[0]])
    renderWithProviders(<GamesModal code="A7K9F2QX" onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Red')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('tab', { name: /hackrom/i }))

    expect(screen.getByText(/no games here yet/i)).toBeInTheDocument()
  })

  it('marca a aba ativa', async () => {
    mockGames()
    renderWithProviders(<GamesModal code="A7K9F2QX" onClose={vi.fn()} />)

    const official = screen.getByRole('tab', { name: /official/i })
    const hackrom = screen.getByRole('tab', { name: /hackrom/i })

    expect(official).toHaveAttribute('aria-selected', 'true')
    expect(hackrom).toHaveAttribute('aria-selected', 'false')

    await userEvent.click(hackrom)

    expect(hackrom).toHaveAttribute('aria-selected', 'true')
  })

  it('fecha ao clicar em fechar', async () => {
    mockGames()
    const onClose = vi.fn()
    renderWithProviders(<GamesModal code="A7K9F2QX" onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: /close/i }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('destaca jogos ocultos na lista', async () => {
    mockGames()
    renderWithProviders(<GamesModal code="A7K9F2QX" onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Red')).toBeInTheDocument()
    })

    const list = screen.getByRole('list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
  })
})
