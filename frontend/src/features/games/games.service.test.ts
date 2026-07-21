import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createGame,
  deleteGame,
  fetchGames,
  renameGame,
  setGameVisibility,
} from './games.service.ts'

const oficial = {
  id: 394,
  name: 'FireRed',
  isOfficial: true,
  visible: true,
}

const hackrom = {
  id: 471,
  name: 'Radical Red',
  isOfficial: false,
  visible: true,
}

const code = 'A7K9F2QX'

function mockFetch(body: unknown, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        status === 204
          ? new Response(null, { status })
          : new Response(JSON.stringify(body), {
              status,
              headers: { 'Content-Type': 'application/json' },
            }),
      ),
    ),
  )
}

describe('games.service', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lista jogos da coleção', async () => {
    mockFetch([oficial, hackrom])

    await expect(fetchGames(code)).resolves.toHaveLength(2)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/A7K9F2QX/games',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('cadastra hackrom enviando o nome', async () => {
    mockFetch(hackrom)

    await expect(createGame(code, 'Radical Red')).resolves.toEqual(hackrom)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/A7K9F2QX/games',
      expect.objectContaining({
        method: 'POST',
        body: '{"name":"Radical Red"}',
      }),
    )
  })

  it('renomeia jogo', async () => {
    mockFetch({ ...hackrom, name: 'Radical Red 4.1' })

    await expect(
      renameGame(code, 471, 'Radical Red 4.1'),
    ).resolves.toMatchObject({ name: 'Radical Red 4.1' })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/A7K9F2QX/games/471',
      expect.objectContaining({
        method: 'PATCH',
        body: '{"name":"Radical Red 4.1"}',
      }),
    )
  })

  it('alterna visibilidade', async () => {
    mockFetch({ ...oficial, visible: false })

    await expect(setGameVisibility(code, 394, false)).resolves.toMatchObject({
      visible: false,
    })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/A7K9F2QX/games/394/visibility',
      expect.objectContaining({
        method: 'PATCH',
        body: '{"visible":false}',
      }),
    )
  })

  it('exclui hackrom', async () => {
    mockFetch(null, 204)

    await expect(deleteGame(code, 471)).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/collections/A7K9F2QX/games/471',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('propaga nome duplicado como conflito', async () => {
    mockFetch({ error: 'já existe um jogo com esse nome nesta coleção' }, 409)

    await expect(createGame(code, 'FireRed')).rejects.toMatchObject({
      status: 409,
      isConflict: true,
      message: 'já existe um jogo com esse nome nesta coleção',
    })
  })

  it('propaga bloqueio de exclusão com pokémon vinculado', async () => {
    mockFetch(
      {
        error: 'não é possível excluir: existem Pokémon vinculados a este jogo',
      },
      409,
    )

    await expect(deleteGame(code, 471)).rejects.toMatchObject({
      status: 409,
      message: 'não é possível excluir: existem Pokémon vinculados a este jogo',
    })
  })

  it('propaga proteção de jogo oficial', async () => {
    mockFetch(
      { error: 'jogos oficiais não podem ser renomeados nem excluídos' },
      403,
    )

    await expect(renameGame(code, 394, 'Vermelho')).rejects.toMatchObject({
      status: 403,
      kind: 'client',
    })
  })
})
