import { useCallback, useState } from 'react'
import type { PokemonAttributes } from '../../pokemon.service.ts'
import type { PokemonGender } from '../../pokemon.schema.ts'

export type PokemonForm = {
  values: PokemonAttributes
  canSubmit: boolean
  setField: <K extends keyof PokemonAttributes>(
    field: K,
    value: PokemonAttributes[K],
  ) => void
  reset: () => void
}

function emptyForm(gameId: number): PokemonAttributes {
  return {
    pokemonName: '',
    nickname: '',
    isShiny: false,
    gender: 'male',
    form: '',
    gameId,
  }
}

export function useAddPokemonForm(defaultGameId: number): PokemonForm {
  const [values, setValues] = useState<PokemonAttributes>(() =>
    emptyForm(defaultGameId),
  )

  const setField = useCallback(
    <K extends keyof PokemonAttributes>(
      field: K,
      value: PokemonAttributes[K],
    ) => {
      setValues((current) => ({ ...current, [field]: value }))
    },
    [],
  )

  const reset = useCallback(() => {
    setValues(emptyForm(defaultGameId))
  }, [defaultGameId])

  const gameId = values.gameId > 0 ? values.gameId : defaultGameId

  return {
    values: { ...values, gameId },
    canSubmit: values.pokemonName.trim() !== '' && gameId > 0,
    setField,
    reset,
  }
}

export function genderOptions(): readonly PokemonGender[] {
  return ['male', 'female', 'genderless'] as const
}
