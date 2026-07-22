import { screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../test/renderWithProviders.tsx'
import { BoxContent } from './BoxContent.tsx'

const bulbasaur = {
  id: 1,
  pokemonName: 'bulbasaur',
  nickname: '',
  isShiny: false,
  gender: 'male',
  form: '',
  gameId: 10,
  boxNumber: 1,
  slot: 0,
  sprite: 'https://sprites/1.png',
}

function mockFetch(body: unknown, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    ),
  )
}

describe('BoxContent', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('busca os pokémon da box pedida', async () => {
    mockFetch([bulbasaur])
    renderWithProviders(<BoxContent code="A7K9F2QX" boxNumber={2} />)

    await waitFor(() => {
      expect(screen.getByRole('list')).toBeInTheDocument()
    })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/A7K9F2QX/pokemons?box=2',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('mostra carregamento antes da resposta', () => {
    mockFetch([])
    renderWithProviders(<BoxContent code="A7K9F2QX" boxNumber={1} />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('mostra a box vazia sem erro', async () => {
    mockFetch([])
    renderWithProviders(<BoxContent code="A7K9F2QX" boxNumber={1} />)

    await waitFor(() => {
      expect(screen.getByRole('list')).toBeInTheDocument()
    })
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('avisa quando a busca falha', async () => {
    mockFetch({ error: 'falhou' }, 500)
    renderWithProviders(<BoxContent code="A7K9F2QX" boxNumber={1} />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})
