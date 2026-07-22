import { screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../test/renderWithProviders.tsx'
import { PokemonDetail } from './PokemonDetail.tsx'

const rattata = {
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

const firered = { id: 42, name: 'FireRed', isOfficial: true, visible: true }

function mockApi(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const body = url.includes('/games') ? [firered] : [rattata]

      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }),
  )
}

describe('PokemonDetail', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('pede para escolher um pokémon quando nada está selecionado', () => {
    mockApi()
    renderWithProviders(
      <PokemonDetail code="A7K9F2QX" boxNumber={1} slot={null} />,
    )

    expect(screen.getByText(/select a pok/i)).toBeInTheDocument()
  })

  it('mostra apelido, espécie e atributos do pokémon do slot', async () => {
    mockApi()
    renderWithProviders(
      <PokemonDetail code="A7K9F2QX" boxNumber={1} slot={3} />,
    )

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Ratinho' }),
      ).toBeInTheDocument()
    })

    expect(screen.getByText('rattata')).toBeInTheDocument()
    expect(screen.getByText('Female')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('rattata-alola')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('FireRed')).toBeInTheDocument()
    })
  })

  it('usa o nome da espécie quando não há apelido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              url.includes('/games')
                ? [firered]
                : [{ ...rattata, nickname: '', isShiny: false, form: '' }],
            ),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        ),
      ),
    )

    renderWithProviders(
      <PokemonDetail code="A7K9F2QX" boxNumber={1} slot={3} />,
    )

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'rattata' }),
      ).toBeInTheDocument()
    })
    expect(screen.getByText('No')).toBeInTheDocument()
    expect(screen.queryByText('Form')).not.toBeInTheDocument()
  })

  it('avisa quando o pokémon está sem sprite', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              url.includes('/games') ? [firered] : [{ ...rattata, sprite: '' }],
            ),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        ),
      ),
    )

    renderWithProviders(
      <PokemonDetail code="A7K9F2QX" boxNumber={1} slot={3} />,
    )

    await waitFor(() => {
      expect(screen.getByText(/no sprite/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
