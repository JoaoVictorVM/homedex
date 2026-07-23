import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../test/renderWithProviders.tsx'
import { HackromForm } from './HackromForm.tsx'

function mockApi(erro?: {
  status: number
  message: string
}): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn((_url: string, options?: RequestInit) => {
    if (options?.method === 'POST') {
      return Promise.resolve(
        erro === undefined
          ? json(
              { id: 9, name: 'Radical Red', isOfficial: false, visible: true },
              201,
            )
          : json({ error: erro.message }, erro.status),
      )
    }

    return Promise.resolve(json([]))
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

describe('HackromForm', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('mantém o envio desabilitado sem nome', () => {
    mockApi()
    renderWithProviders(<HackromForm code="A7K9F2QX" />)

    expect(screen.getByRole('button', { name: /^add$/i })).toBeDisabled()
  })

  it('cadastra a hackrom e limpa o campo', async () => {
    const fetchMock = mockApi()
    renderWithProviders(<HackromForm code="A7K9F2QX" />)

    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'Radical Red')
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/collections/A7K9F2QX/games',
        expect.objectContaining({
          method: 'POST',
          body: '{"name":"Radical Red"}',
        }),
      )
    })

    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })

  it('mostra o erro de nome duplicado', async () => {
    mockApi({
      status: 409,
      message: 'já existe um jogo com esse nome nesta coleção',
    })
    renderWithProviders(<HackromForm code="A7K9F2QX" />)

    await userEvent.type(screen.getByRole('textbox'), 'FireRed')
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/já existe/i)
    })
  })
})
