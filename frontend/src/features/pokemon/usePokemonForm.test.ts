import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { emptyAttributes, usePokemonForm } from './usePokemonForm.ts'

describe('usePokemonForm', () => {
  it('começa vazio com o jogo padrão', () => {
    const { result } = renderHook(() => usePokemonForm(emptyAttributes(42), 42))

    expect(result.current.values).toEqual({
      pokemonName: '',
      nickname: '',
      isShiny: false,
      gender: 'male',
      form: '',
      gameId: 42,
    })
  })

  it('não permite enviar sem o nome do pokémon', () => {
    const { result } = renderHook(() => usePokemonForm(emptyAttributes(42), 42))

    expect(result.current.canSubmit).toBe(false)

    act(() => {
      result.current.setField('pokemonName', '   ')
    })
    expect(result.current.canSubmit).toBe(false)

    act(() => {
      result.current.setField('pokemonName', 'bulbasaur')
    })
    expect(result.current.canSubmit).toBe(true)
  })

  it('não permite enviar sem jogo disponível', () => {
    const { result } = renderHook(() => usePokemonForm(emptyAttributes(0), 0))

    act(() => {
      result.current.setField('pokemonName', 'bulbasaur')
    })

    expect(result.current.canSubmit).toBe(false)
  })

  it('atualiza cada campo mantendo os demais', () => {
    const { result } = renderHook(() => usePokemonForm(emptyAttributes(42), 42))

    act(() => {
      result.current.setField('pokemonName', 'rattata')
    })
    act(() => {
      result.current.setField('isShiny', true)
    })
    act(() => {
      result.current.setField('gender', 'female')
    })
    act(() => {
      result.current.setField('form', 'rattata-alola')
    })

    expect(result.current.values).toMatchObject({
      pokemonName: 'rattata',
      isShiny: true,
      gender: 'female',
      form: 'rattata-alola',
      gameId: 42,
    })
  })

  it('aceita valores iniciais na edição', () => {
    const { result } = renderHook(() =>
      usePokemonForm(
        {
          pokemonName: 'rattata',
          nickname: 'Ratinho',
          isShiny: true,
          gender: 'female',
          form: 'rattata-alola',
          gameId: 7,
        },
        7,
      ),
    )

    expect(result.current.values.nickname).toBe('Ratinho')
    expect(result.current.canSubmit).toBe(true)
  })

  it('cai no jogo padrão quando o escolhido some', () => {
    const { result } = renderHook(() => usePokemonForm(emptyAttributes(0), 99))

    expect(result.current.values.gameId).toBe(99)
  })
})
