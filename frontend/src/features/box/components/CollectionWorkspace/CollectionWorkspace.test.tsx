import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../test/renderWithProviders.tsx'
import { CollectionWorkspace } from './CollectionWorkspace.tsx'

const firered = { id: 42, name: 'FireRed', isOfficial: true, visible: true }

const bulbasaur = {
  id: 1,
  pokemonName: 'bulbasaur',
  nickname: 'Bulby',
  isShiny: false,
  gender: 'male',
  form: '',
  gameId: 42,
  boxNumber: 1,
  slot: 0,
  sprite: 'https://sprites/1.png',
}

function json(body: unknown, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockApi(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.includes('/games')) {
        return Promise.resolve(json([firered]))
      }
      if (url.includes('/pokemon-forms')) {
        return Promise.resolve(json({ forms: ['bulbasaur'] }))
      }
      if (url.includes('/sprite')) {
        return Promise.resolve(json({ sprite: 'https://sprites/1.png' }))
      }
      if (url.includes('/pokemons')) {
        return Promise.resolve(json([bulbasaur]))
      }
      return Promise.resolve(json([]))
    }),
  )
}

function renderWorkspace(boxCount = 1): void {
  renderWithProviders(
    <CollectionWorkspace
      code="A7K9F2QX"
      boxCount={boxCount}
      onLeave={vi.fn()}
    />,
  )
}

describe('CollectionWorkspace', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('mostra a box, o código e a navegação', async () => {
    mockApi()
    renderWorkspace()

    expect(screen.getByText('A7K9-F2QX')).toBeInTheDocument()
    expect(screen.getByText('Box 1')).toBeInTheDocument()
    expect(screen.getByText('1-30')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Bulby' })).toBeInTheDocument()
    })
  })

  it('mostra os detalhes ao selecionar um pokémon', async () => {
    mockApi()
    renderWorkspace()

    await userEvent.click(await screen.findByRole('button', { name: 'Bulby' }))

    const detail = screen.getByRole('complementary')
    expect(
      within(detail).getByRole('heading', { name: 'Bulby' }),
    ).toBeInTheDocument()
    expect(within(detail).getByText('bulbasaur')).toBeInTheDocument()
  })

  it('abre o modal de adicionar pokémon', async () => {
    mockApi()
    renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: /add pok/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/pok.mon name/i)).toBeInTheDocument()
  })

  it('abre o modal de jogos', async () => {
    mockApi()
    renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: /^games$/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('FireRed')).toBeInTheDocument()
    })
  })

  it('oferece editar e remover a partir do pokémon selecionado', async () => {
    mockApi()
    renderWorkspace()

    await userEvent.click(await screen.findByRole('button', { name: 'Bulby' }))

    const detail = screen.getByRole('complementary')
    await userEvent.click(
      within(detail).getByRole('button', { name: /remove/i }),
    )

    expect(screen.getByRole('dialog')).toHaveTextContent(/remove bulby/i)
  })

  it('navega para a próxima box quando há mais de uma', async () => {
    mockApi()
    renderWorkspace(3)

    await userEvent.click(screen.getByRole('button', { name: /next box/i }))

    expect(screen.getByText('Box 2')).toBeInTheDocument()
    expect(screen.getByText('31-60')).toBeInTheDocument()
  })
})
