import { describe, expect, it } from 'vitest'
import { isValidCode, normalizeCode } from './code.ts'

describe('normalizeCode', () => {
  it('remove separador, espaços e converte para maiúsculas', () => {
    expect(normalizeCode(' a7k9-f2qx ')).toBe('A7K9F2QX')
  })
})

describe('isValidCode', () => {
  it('aceita códigos válidos em qualquer formatação', () => {
    expect(isValidCode('A7K9F2QX')).toBe(true)
    expect(isValidCode('a7k9-f2qx')).toBe(true)
    expect(isValidCode('  A7K9-F2QX  ')).toBe(true)
  })

  it('rejeita tamanho errado', () => {
    expect(isValidCode('A7K9F2Q')).toBe(false)
    expect(isValidCode('A7K9F2QXZ')).toBe(false)
    expect(isValidCode('')).toBe(false)
  })

  it('rejeita caracteres ambíguos e inválidos', () => {
    expect(isValidCode('A7K9F2Q0')).toBe(false)
    expect(isValidCode('A7K9F2QO')).toBe(false)
    expect(isValidCode('A7K9F2QI')).toBe(false)
    expect(isValidCode('A7K9F2Q1')).toBe(false)
    expect(isValidCode('A7K9F2Q@')).toBe(false)
  })

  it('aceita L, que não faz parte dos caracteres ambíguos', () => {
    expect(isValidCode('A7K9F2QL')).toBe(true)
  })
})
