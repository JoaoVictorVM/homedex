import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../test/renderWithProviders.tsx'
import { EditPokemonModal } from './EditPokemonModal.tsx'
import type { Pokemon } from '../../pokemon.schema.ts'

const firered = { id: 42, name: 'FireRed', isOfficial: true, visible: true }
const leafgreen = { id: 43, name: 'LeafGreen', isOfficial: true, visible: true }

const rattata: Pokemon = {
  id: 7,
  pokemonName: 'rattata',
  nickname: 'Ratinho',
  isShiny: true,
  gender: 'female',
  form: 'rattata-alola',
  gameId: 42,
  boxNumber: 1,
  slot: 3,
  sprite: 'https://sprites/shiny/10091.png',
}

function mockApi(erro?: { status: number; message: string }): void {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, options?: RequestInit) => {
      if (url.includes('/games')) {
        return Promise.resolve(json([firered, leafgreen]))
      }
      if (url.includes('/pokemon-forms')) {
        return Promise.resolve(json({ forms: ['rattata', 'rattata-alola'] }))
      }
      if (url.includes('/sprite')) {
        return Promise.resolve(json({ sprite: 'https://sprites/x.png' }))
      }
      if (options?.method === 'PATCH') {
        return Promise.resolve(
          erro === undefined
            ? json({ ...rattata, nickname: 'Novo' })
            : json({ error: erro.message }, erro.status),
        )
      }

      return Promise.resolve(json([rattata]))
    }),
  )
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('EditPokemonModal', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('vem pré-preenchido com os atributos do pokémon', async () => {
    mockApi()
    renderWithProviders(
      <EditPokemonModal
        code="A7K9F2QX"
        boxNumber={1}
        pokemon={rattata}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByLabelText(/pok.mon name/i)).toHaveValue('rattata')
    expect(screen.getByLabelText(/nickname/i)).toHaveValue('Ratinho')
    expect(screen.getByLabelText(/shiny/i)).toBeChecked()

    await waitFor(() => {
      expect(screen.getByLabelText(/gender/i)).toHaveValue('female')
    })
  })

  it('salva os atributos editados', async () => {
    mockApi()
    const onClose = vi.fn()
    renderWithProviders(
      <EditPokemonModal
        code="A7K9F2QX"
        boxNumber={1}
        pokemon={rattata}
        onClose={onClose}
      />,
    )

    const nickname = screen.getByLabelText(/nickname/i)
    await userEvent.clear(nickname)
    await userEvent.type(nickname, 'Novo')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce()
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/A7K9F2QX/pokemons/7',
      expect.objectContaining({ method: 'PATCH' }),
    )
  })

  it('mostra o erro devolvido pelo servidor', async () => {
    mockApi({ status: 400, message: 'pokémon não encontrado na PokéAPI' })
    renderWithProviders(
      <EditPokemonModal
        code="A7K9F2QX"
        boxNumber={1}
        pokemon={rattata}
        onClose={vi.fn()}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/PokéAPI/i)
    })
  })
})
