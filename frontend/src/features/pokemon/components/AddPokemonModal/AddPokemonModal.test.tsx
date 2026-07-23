import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../test/renderWithProviders.tsx'
import { AddPokemonModal } from './AddPokemonModal.tsx'

const firered = { id: 42, name: 'FireRed', isOfficial: true, visible: true }
const leafgreen = { id: 43, name: 'LeafGreen', isOfficial: true, visible: true }
const oculto = { id: 44, name: 'Emerald', isOfficial: true, visible: false }

const criado = {
  id: 1,
  pokemonName: 'bulbasaur',
  nickname: 'Bulby',
  isShiny: true,
  gender: 'female',
  form: '',
  gameId: 43,
  boxNumber: 1,
  slot: 0,
  sprite: 'https://sprites/1.png',
}

function mockApi(
  pokemons: unknown[] = [],
  erro?: { status: number; message: string },
): void {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, options?: RequestInit) => {
      if (url.includes('/games')) {
        return Promise.resolve(jsonResponse([firered, leafgreen, oculto]))
      }
      if (url.includes('/pokemon-forms')) {
        return Promise.resolve(jsonResponse({ forms: ['bulbasaur'] }))
      }
      if (url.includes('/sprite')) {
        return Promise.resolve(
          jsonResponse({ sprite: 'https://sprites/1.png' }),
        )
      }
      if (options?.method === 'POST') {
        return Promise.resolve(
          erro === undefined
            ? jsonResponse(criado, 201)
            : jsonResponse({ error: erro.message }, erro.status),
        )
      }

      return Promise.resolve(jsonResponse(pokemons))
    }),
  )
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function ocupando(slots: number[]): unknown[] {
  return slots.map((slot, index) => ({ ...criado, id: index + 1, slot }))
}

describe('AddPokemonModal', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('mostra os campos do cadastro', async () => {
    mockApi()
    renderWithProviders(
      <AddPokemonModal code="A7K9F2QX" boxNumber={1} onClose={vi.fn()} />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/pok.mon name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/gender/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/shiny/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'FireRed' }),
      ).toBeInTheDocument()
    })
  })

  it('lista apenas os jogos visíveis no dropdown', async () => {
    mockApi()
    renderWithProviders(
      <AddPokemonModal code="A7K9F2QX" boxNumber={1} onClose={vi.fn()} />,
    )

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'FireRed' }),
      ).toBeInTheDocument()
    })

    expect(
      screen.getByRole('option', { name: 'LeafGreen' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('option', { name: 'Emerald' }),
    ).not.toBeInTheDocument()
  })

  it('só habilita o envio depois do nome', async () => {
    mockApi()
    renderWithProviders(
      <AddPokemonModal code="A7K9F2QX" boxNumber={1} onClose={vi.fn()} />,
    )

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'FireRed' }),
      ).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /^add$/i })).toBeDisabled()

    await userEvent.type(screen.getByLabelText(/pok.mon name/i), 'bulbasaur')

    expect(screen.getByRole('button', { name: /^add$/i })).toBeEnabled()
  })

  it('envia os atributos no primeiro slot livre', async () => {
    mockApi(ocupando([0, 1]))
    const onClose = vi.fn()
    renderWithProviders(
      <AddPokemonModal code="A7K9F2QX" boxNumber={2} onClose={onClose} />,
    )

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'LeafGreen' }),
      ).toBeInTheDocument()
    })

    await userEvent.type(screen.getByLabelText(/pok.mon name/i), 'bulbasaur')
    await userEvent.type(screen.getByLabelText(/nickname/i), 'Bulby')
    await userEvent.click(screen.getByLabelText(/shiny/i))
    await userEvent.selectOptions(screen.getByLabelText(/gender/i), 'female')
    await userEvent.selectOptions(screen.getByLabelText(/game/i), '43')
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce()
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/A7K9F2QX/pokemons',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          pokemonName: 'bulbasaur',
          nickname: 'Bulby',
          isShiny: true,
          gender: 'female',
          form: '',
          gameId: 43,
          boxNumber: 2,
          slot: 2,
        }),
      }),
    )
  })

  it('avisa quando a box está cheia', async () => {
    mockApi(ocupando(Array.from({ length: 30 }, (_, index) => index)))
    renderWithProviders(
      <AddPokemonModal code="A7K9F2QX" boxNumber={1} onClose={vi.fn()} />,
    )

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/box is full/i)
    })
    expect(screen.getByRole('button', { name: /^add$/i })).toBeDisabled()
  })

  it('mostra o erro devolvido pelo servidor', async () => {
    mockApi([], { status: 400, message: 'pokémon não encontrado na PokéAPI' })
    renderWithProviders(
      <AddPokemonModal code="A7K9F2QX" boxNumber={1} onClose={vi.fn()} />,
    )

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'FireRed' }),
      ).toBeInTheDocument()
    })

    await userEvent.type(screen.getByLabelText(/pok.mon name/i), 'naoexiste')
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/PokéAPI/i)
    })
  })

  it('fecha ao cancelar', async () => {
    mockApi()
    const onClose = vi.fn()
    renderWithProviders(
      <AddPokemonModal code="A7K9F2QX" boxNumber={1} onClose={onClose} />,
    )

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('fecha com a tecla Esc', async () => {
    mockApi()
    const onClose = vi.fn()
    renderWithProviders(
      <AddPokemonModal code="A7K9F2QX" boxNumber={1} onClose={onClose} />,
    )

    await userEvent.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledOnce()
  })
})
