import { describe, expect, it } from 'vitest'
import { pokemonListSchema, pokemonSchema } from './pokemon.schema.ts'

const respostaDoBackend = {
  id: 23,
  pokemonName: 'rattata',
  nickname: 'Ratinho',
  isShiny: true,
  gender: 'female',
  form: 'rattata-alola',
  gameId: 738,
  boxNumber: 1,
  slot: 5,
  sprite: 'https://sprites/shiny/10091.png',
}

describe('pokemonSchema', () => {
  it('aceita a resposta do backend', () => {
    expect(pokemonSchema.parse(respostaDoBackend)).toEqual(respostaDoBackend)
  })

  it('aceita apelido, forma e sprite vazios', () => {
    const semOpcionais = {
      ...respostaDoBackend,
      nickname: '',
      form: '',
      sprite: '',
    }

    expect(pokemonSchema.safeParse(semOpcionais).success).toBe(true)
  })

  it('aceita os três sexos', () => {
    for (const gender of ['male', 'female', 'genderless']) {
      expect(
        pokemonSchema.safeParse({ ...respostaDoBackend, gender }).success,
      ).toBe(true)
    }
  })

  it('rejeita valores fora do domínio', () => {
    const invalidos = [
      { ...respostaDoBackend, gender: 'macho' },
      { ...respostaDoBackend, slot: 30 },
      { ...respostaDoBackend, slot: -1 },
      { ...respostaDoBackend, boxNumber: 0 },
      { ...respostaDoBackend, boxNumber: 33 },
      { ...respostaDoBackend, id: 0 },
      { ...respostaDoBackend, pokemonName: '' },
    ]

    for (const invalido of invalidos) {
      expect(pokemonSchema.safeParse(invalido).success).toBe(false)
    }
  })

  it('rejeita campos ausentes ou de tipo errado', () => {
    const semNickname: Record<string, unknown> = { ...respostaDoBackend }
    delete semNickname.nickname

    expect(pokemonSchema.safeParse(semNickname).success).toBe(false)
    expect(
      pokemonSchema.safeParse({ ...respostaDoBackend, isShiny: 'sim' }).success,
    ).toBe(false)
  })

  it('valida a lista de uma box', () => {
    expect(pokemonListSchema.parse([])).toEqual([])
    expect(pokemonListSchema.safeParse([respostaDoBackend]).success).toBe(true)
    expect(pokemonListSchema.safeParse(respostaDoBackend).success).toBe(false)
  })
})
