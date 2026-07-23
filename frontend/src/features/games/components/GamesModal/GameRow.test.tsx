import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../test/renderWithProviders.tsx'
import { GameRow } from './GameRow.tsx'
import type { Game } from '../../game.schema.ts'

const visivel: Game = { id: 1, name: 'Red', isOfficial: true, visible: true }
const oculto: Game = { id: 2, name: 'Blue', isOfficial: true, visible: false }

function mockToggle(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify({ ...visivel, visible: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )
  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

describe('GameRow', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('oferece ocultar quando o jogo está visível', () => {
    mockToggle()
    renderWithProviders(
      <ul>
        <GameRow code="A7K9F2QX" game={visivel} />
      </ul>,
    )

    expect(screen.getByRole('button', { name: /hide/i })).toBeInTheDocument()
  })

  it('oferece mostrar quando o jogo está oculto', () => {
    mockToggle()
    renderWithProviders(
      <ul>
        <GameRow code="A7K9F2QX" game={oculto} />
      </ul>,
    )

    expect(screen.getByRole('button', { name: /show/i })).toBeInTheDocument()
  })

  it('alterna a visibilidade pela API', async () => {
    const fetchMock = mockToggle()
    renderWithProviders(
      <ul>
        <GameRow code="A7K9F2QX" game={visivel} />
      </ul>,
    )

    await userEvent.click(screen.getByRole('button', { name: /hide/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/collections/A7K9F2QX/games/1/visibility',
        expect.objectContaining({
          method: 'PATCH',
          body: '{"visible":false}',
        }),
      )
    })
  })
})
