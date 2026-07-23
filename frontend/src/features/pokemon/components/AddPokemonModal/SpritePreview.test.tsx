import { screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../test/renderWithProviders.tsx'
import { SpritePreview } from './SpritePreview.tsx'

function mockSprite(body: unknown, status = 200): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )
  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

describe('SpritePreview', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('pede o nome quando está vazio e não chama a API', () => {
    const fetchMock = mockSprite({ sprite: '' })
    renderWithProviders(<SpritePreview name="" form="" shiny={false} />)

    expect(screen.getByText(/type a name/i)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('mostra a sprite resolvida pelo backend', async () => {
    mockSprite({ sprite: 'https://sprites/shiny/10091.png' })
    renderWithProviders(
      <SpritePreview name="rattata" form="rattata-alola" shiny />,
    )

    await waitFor(() => {
      expect(screen.getByRole('img')).toHaveAttribute(
        'src',
        'https://sprites/shiny/10091.png',
      )
    })
  })

  it('pede a sprite com nome, forma e shiny na query', async () => {
    const fetchMock = mockSprite({ sprite: 'https://sprites/x.png' })
    renderWithProviders(
      <SpritePreview name="  Rattata  " form=" rattata-alola " shiny />,
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/sprite?name=Rattata&form=rattata-alola&shiny=true',
        expect.objectContaining({ method: 'GET' }),
      )
    })
  })

  it('avisa quando a sprite não é encontrada', async () => {
    mockSprite({ error: 'pokémon não encontrado na PokéAPI' }, 404)
    renderWithProviders(
      <SpritePreview name="naoexiste" form="" shiny={false} />,
    )

    await waitFor(() => {
      expect(screen.getByText(/sprite not found/i)).toBeInTheDocument()
    })
  })

  it('trata sprite vazia como não encontrada', async () => {
    mockSprite({ sprite: '' })
    renderWithProviders(
      <SpritePreview name="missingno" form="" shiny={false} />,
    )

    await waitFor(() => {
      expect(screen.getByText(/sprite not found/i)).toBeInTheDocument()
    })
  })
})
