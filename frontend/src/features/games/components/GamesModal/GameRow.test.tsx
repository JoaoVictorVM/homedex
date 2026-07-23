import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../test/renderWithProviders.tsx'
import { GameRow } from './GameRow.tsx'
import type { Game } from '../../game.schema.ts'

const oficial: Game = { id: 1, name: 'Red', isOfficial: true, visible: true }
const oculto: Game = { id: 2, name: 'Blue', isOfficial: true, visible: false }
const hackrom: Game = {
  id: 3,
  name: 'Radical Red',
  isOfficial: false,
  visible: true,
}

function mockApi(erro?: {
  status: number
  message: string
}): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn((_url: string, options?: RequestInit) => {
    if (options?.method === 'DELETE') {
      return Promise.resolve(
        erro === undefined
          ? new Response(null, { status: 204 })
          : json({ error: erro.message }, erro.status),
      )
    }

    return Promise.resolve(json({ ...hackrom, name: 'Renomeado' }))
  })
  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderRow(game: Game): void {
  renderWithProviders(
    <ul>
      <GameRow code="A7K9F2QX" game={game} />
    </ul>,
  )
}

describe('GameRow', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('oferece ocultar quando o jogo está visível', () => {
    mockApi()
    renderRow(oficial)

    expect(screen.getByRole('button', { name: /hide/i })).toBeInTheDocument()
  })

  it('oferece mostrar quando o jogo está oculto', () => {
    mockApi()
    renderRow(oculto)

    expect(screen.getByRole('button', { name: /show/i })).toBeInTheDocument()
  })

  it('não mostra renomear nem excluir em jogo oficial', () => {
    mockApi()
    renderRow(oficial)

    expect(
      screen.queryByRole('button', { name: /rename/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /delete/i }),
    ).not.toBeInTheDocument()
  })

  it('mostra renomear e excluir em hackrom', () => {
    mockApi()
    renderRow(hackrom)

    expect(screen.getByRole('button', { name: /rename/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })

  it('renomeia a hackrom', async () => {
    const fetchMock = mockApi()
    renderRow(hackrom)

    await userEvent.click(screen.getByRole('button', { name: /rename/i }))
    const input = screen.getByRole('textbox')
    await userEvent.clear(input)
    await userEvent.type(input, 'Radical Red 4.1')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/collections/A7K9F2QX/games/3',
        expect.objectContaining({
          method: 'PATCH',
          body: '{"name":"Radical Red 4.1"}',
        }),
      )
    })
  })

  it('exclui a hackrom após confirmação', async () => {
    const fetchMock = mockApi()
    renderRow(hackrom)

    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    const dialog = screen.getByRole('dialog')

    await userEvent.click(
      within(dialog).getByRole('button', { name: /^delete$/i }),
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/collections/A7K9F2QX/games/3',
        expect.objectContaining({ method: 'DELETE' }),
      )
    })
  })

  it('mostra o erro de exclusão bloqueada', async () => {
    mockApi({
      status: 409,
      message: 'não é possível excluir: existem Pokémon vinculados a este jogo',
    })
    renderRow(hackrom)

    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    const dialog = screen.getByRole('dialog')
    await userEvent.click(
      within(dialog).getByRole('button', { name: /^delete$/i }),
    )

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/vinculados/i)
    })
  })
})
