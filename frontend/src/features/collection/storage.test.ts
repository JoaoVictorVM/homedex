import { beforeEach, describe, expect, it } from 'vitest'
import { clearStoredCode, readStoredCode, storeCode } from './storage.ts'

describe('storage do código da coleção', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('não devolve código quando nada foi salvo', () => {
    expect(readStoredCode()).toBeNull()
  })

  it('guarda e devolve o código salvo', () => {
    storeCode('A7K9F2QX')

    expect(readStoredCode()).toBe('A7K9F2QX')
  })

  it('normaliza código salvo em outro formato', () => {
    localStorage.setItem('homedex.code', 'a7k9-f2qx')

    expect(readStoredCode()).toBe('A7K9F2QX')
  })

  it('ignora código salvo em formato inválido', () => {
    localStorage.setItem('homedex.code', 'lixo')

    expect(readStoredCode()).toBeNull()
  })

  it('limpa o código salvo', () => {
    storeCode('A7K9F2QX')
    clearStoredCode()

    expect(readStoredCode()).toBeNull()
  })
})
