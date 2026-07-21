import { describe, expect, it } from 'vitest'
import { collectionSchema } from './collection.schema.ts'

const respostaDoBackend = {
  code: 'A7K9F2QX',
  boxCount: 1,
  createdAt: '2026-07-21T08:37:19.869463-03:00',
}

describe('collectionSchema', () => {
  it('aceita a resposta do backend', () => {
    expect(collectionSchema.parse(respostaDoBackend)).toEqual(respostaDoBackend)
  })

  it('rejeita contagem de boxes fora dos limites', () => {
    expect(
      collectionSchema.safeParse({ ...respostaDoBackend, boxCount: 0 }).success,
    ).toBe(false)
    expect(
      collectionSchema.safeParse({ ...respostaDoBackend, boxCount: 33 })
        .success,
    ).toBe(false)
  })

  it('rejeita código ausente', () => {
    expect(
      collectionSchema.safeParse({
        boxCount: respostaDoBackend.boxCount,
        createdAt: respostaDoBackend.createdAt,
      }).success,
    ).toBe(false)
  })
})
