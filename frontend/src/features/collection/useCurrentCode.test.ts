import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useCurrentCode } from './useCurrentCode.ts'

describe('useCurrentCode', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('começa sem código quando nada foi salvo', () => {
    const { result } = renderHook(() => useCurrentCode())

    expect(result.current.code).toBeNull()
  })

  it('recupera o código salvo ao montar', () => {
    localStorage.setItem('homedex.code', 'A7K9F2QX')

    const { result } = renderHook(() => useCurrentCode())

    expect(result.current.code).toBe('A7K9F2QX')
  })

  it('guarda o código ao entrar na coleção', () => {
    const { result } = renderHook(() => useCurrentCode())

    act(() => {
      result.current.enter('DHE4SNN2')
    })

    expect(result.current.code).toBe('DHE4SNN2')
    expect(localStorage.getItem('homedex.code')).toBe('DHE4SNN2')
  })

  it('esquece o código ao sair', () => {
    localStorage.setItem('homedex.code', 'A7K9F2QX')
    const { result } = renderHook(() => useCurrentCode())

    act(() => {
      result.current.leave()
    })

    expect(result.current.code).toBeNull()
    expect(localStorage.getItem('homedex.code')).toBeNull()
  })
})
