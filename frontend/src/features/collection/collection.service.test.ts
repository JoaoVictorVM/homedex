import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCollection, fetchCollection } from './collection.service.ts'

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

describe('collection.service', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('cria coleção via POST /collections', async () => {
    mockFetch(colecao)

    await expect(createCollection()).resolves.toEqual(colecao)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('busca coleção pelo código', async () => {
    mockFetch(colecao)

    await expect(fetchCollection('A7K9F2QX')).resolves.toEqual(colecao)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/A7K9F2QX',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('escapa o código na URL', async () => {
    mockFetch(colecao)

    await fetchCollection('A7K9 F2QX/../admin')

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/A7K9%20F2QX%2F..%2Fadmin',
      expect.anything(),
    )
  })

  it('propaga erro de código inexistente', async () => {
    mockFetch({ error: 'código de coleção não encontrado' }, 404)

    await expect(fetchCollection('AAAAAAAA')).rejects.toMatchObject({
      status: 404,
      message: 'código de coleção não encontrado',
    })
  })

  it('rejeita resposta fora do schema', async () => {
    mockFetch({ code: 'A7K9F2QX' })

    await expect(fetchCollection('A7K9F2QX')).rejects.toMatchObject({
      kind: 'parse',
    })
  })
})
