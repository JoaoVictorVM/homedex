import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App.tsx'
import { renderWithProviders } from './test/renderWithProviders.tsx'

const colecao = {
  code: 'A7K9F2QX',
  boxCount: 1,
  createdAt: '2026-07-21T08:37:19.869463-03:00',
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

async function digitarCodigo(code: string): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: /code/i }))
  await userEvent.type(screen.getByRole('textbox'), code)
  await userEvent.click(screen.getByRole('button', { name: /enter/i }))
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('abre no modal de entrada', () => {
    mockFetch(colecao)
    renderWithProviders(<App />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('recupera a coleção pelo código digitado', async () => {
    mockFetch(colecao)
    renderWithProviders(<App />)

    await digitarCodigo('a7k9-f2qx')

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'A7K9F2QX' }),
      ).toBeInTheDocument()
    })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/A7K9F2QX',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('cria coleção zerada e entra nela', async () => {
    mockFetch({ ...colecao, code: 'DHE4SNN2' }, 201)
    renderWithProviders(<App />)

    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'DHE4SNN2' }),
      ).toBeInTheDocument()
    })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('não busca a coleção recém-criada de novo', async () => {
    mockFetch({ ...colecao, code: 'DHE4SNN2' }, 201)
    renderWithProviders(<App />)

    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'DHE4SNN2' }),
      ).toBeInTheDocument()
    })
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('guarda o código usado para a próxima visita', async () => {
    mockFetch(colecao)
    renderWithProviders(<App />)

    await digitarCodigo('a7k9-f2qx')

    await waitFor(() => {
      expect(localStorage.getItem('homedex.code')).toBe('A7K9F2QX')
    })
  })

  it('entra direto na coleção salva, sem passar pelo modal', async () => {
    localStorage.setItem('homedex.code', 'A7K9F2QX')
    mockFetch(colecao)
    renderWithProviders(<App />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'A7K9F2QX' }),
      ).toBeInTheDocument()
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mantém o modal aberto enquanto busca o código digitado', async () => {
    let responder: (response: Response) => void = () => undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            responder = resolve
          }),
      ),
    )
    renderWithProviders(<App />)

    await digitarCodigo('a7k9-f2qx')

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    act(() => {
      responder(
        new Response(JSON.stringify(colecao), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    })

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'A7K9F2QX' }),
      ).toBeInTheDocument()
    })
  })

  it('guarda o código da coleção recém-criada', async () => {
    mockFetch({ ...colecao, code: 'DHE4SNN2' }, 201)
    renderWithProviders(<App />)

    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(localStorage.getItem('homedex.code')).toBe('DHE4SNN2')
    })
  })

  it('permanece no modal quando o código não existe', async () => {
    mockFetch({ error: 'código de coleção não encontrado' }, 404)
    renderWithProviders(<App />)

    await digitarCodigo('AAAAAAAA')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /enter/i })).toBeEnabled()
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
