import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ApiError } from './ApiError.ts'
import { request, requestEmpty } from './client.ts'

const schema = z.object({ code: z.string() })

function mockFetch(response: Response | Error): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      response instanceof Error
        ? Promise.reject(response)
        : Promise.resolve(response),
    ),
  )
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('request', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('retorna dados validados pelo schema', async () => {
    mockFetch(jsonResponse({ code: 'A7K9F2QX' }))

    await expect(request('/collections/X', { schema })).resolves.toEqual({
      code: 'A7K9F2QX',
    })
  })

  it('chama a URL do backend com o caminho informado', async () => {
    mockFetch(jsonResponse({ code: 'A7K9F2QX' }))

    await request('/collections/X', { schema })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/X',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('envia corpo JSON com o content-type correto', async () => {
    mockFetch(jsonResponse({ code: 'A7K9F2QX' }))

    await request('/collections', {
      method: 'POST',
      body: { name: 'Radical Red' },
      schema,
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections',
      expect.objectContaining({
        method: 'POST',
        body: '{"name":"Radical Red"}',
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })

  it('usa a mensagem de erro do backend', async () => {
    mockFetch(jsonResponse({ error: 'código de coleção não encontrado' }, 404))

    await expect(request('/collections/X', { schema })).rejects.toMatchObject({
      message: 'código de coleção não encontrado',
      kind: 'client',
      status: 404,
      isNotFound: true,
    })
  })

  it('classifica erro do servidor', async () => {
    mockFetch(jsonResponse({ error: 'falhou' }, 500))

    await expect(request('/collections/X', { schema })).rejects.toMatchObject({
      kind: 'server',
      status: 500,
    })
  })

  it('classifica falha de rede', async () => {
    mockFetch(new TypeError('failed to fetch'))

    await expect(request('/collections/X', { schema })).rejects.toMatchObject({
      kind: 'network',
      message: 'não foi possível conectar ao servidor',
    })
  })

  it('rejeita resposta fora do formato esperado', async () => {
    mockFetch(jsonResponse({ codigo: 123 }))

    const promise = request('/collections/X', { schema })

    await expect(promise).rejects.toBeInstanceOf(ApiError)
    await expect(promise).rejects.toMatchObject({ kind: 'parse' })
  })

  it('rejeita corpo que não é JSON', async () => {
    mockFetch(new Response('nao e json', { status: 200 }))

    await expect(request('/collections/X', { schema })).rejects.toMatchObject({
      kind: 'parse',
    })
  })
})

describe('requestEmpty', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolve sem corpo em respostas 204', async () => {
    mockFetch(new Response(null, { status: 204 }))

    await expect(
      requestEmpty('/collections/X/pokemons/1', { method: 'DELETE' }),
    ).resolves.toBeUndefined()
  })

  it('propaga erro do backend', async () => {
    mockFetch(jsonResponse({ error: 'pokémon não encontrado' }, 404))

    await expect(
      requestEmpty('/collections/X/pokemons/1', { method: 'DELETE' }),
    ).rejects.toMatchObject({ message: 'pokémon não encontrado', status: 404 })
  })
})
