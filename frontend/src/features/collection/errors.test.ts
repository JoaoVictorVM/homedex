import { describe, expect, it } from 'vitest'
import { ApiError } from '../../lib/api/ApiError.ts'
import { collectionErrorKey, isMissingCollection } from './errors.ts'

describe('isMissingCollection', () => {
  it('reconhece coleção inexistente', () => {
    expect(
      isMissingCollection(new ApiError('x', { kind: 'client', status: 404 })),
    ).toBe(true)
  })

  it('ignora outros erros', () => {
    expect(isMissingCollection(new ApiError('x', { kind: 'network' }))).toBe(
      false,
    )
    expect(isMissingCollection(new Error('qualquer'))).toBe(false)
    expect(isMissingCollection(null)).toBe(false)
  })
})

describe('collectionErrorKey', () => {
  it('mapeia código inexistente', () => {
    expect(
      collectionErrorKey(new ApiError('x', { kind: 'client', status: 404 })),
    ).toBe('entry.error.notFound')
  })

  it('mapeia falha de conexão', () => {
    expect(collectionErrorKey(new ApiError('x', { kind: 'network' }))).toBe(
      'entry.error.network',
    )
  })

  it('mapeia código em formato inválido', () => {
    expect(
      collectionErrorKey(new ApiError('x', { kind: 'client', status: 400 })),
    ).toBe('entry.error.invalidCode')
  })

  it('cai na mensagem genérica para o resto', () => {
    expect(
      collectionErrorKey(new ApiError('x', { kind: 'server', status: 500 })),
    ).toBe('entry.error.generic')
    expect(collectionErrorKey(new Error('qualquer'))).toBe(
      'entry.error.generic',
    )
  })
})
