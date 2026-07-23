import { useCallback, useState } from 'react'
import type { PokemonAttributes } from './pokemon.service.ts'
import type { PokemonGender } from './pokemon.schema.ts'

export type PokemonForm = {
  values: PokemonAttributes
  canSubmit: boolean
  setField: <K extends keyof PokemonAttributes>(
    field: K,
    value: PokemonAttributes[K],
  ) => void
}

export function emptyAttributes(gameId: number): PokemonAttributes {
  return {
    pokemonName: '',
    nickname: '',
    isShiny: false,
    gender: 'male',
    form: '',
    gameId,
  }
}

export function usePokemonForm(
  initial: PokemonAttributes,
  fallbackGameId: number,
): PokemonForm {
  const [values, setValues] = useState<PokemonAttributes>(initial)

  const setField = useCallback(
    <K extends keyof PokemonAttributes>(
      field: K,
      value: PokemonAttributes[K],
    ) => {
      setValues((current) => ({ ...current, [field]: value }))
    },
    [],
  )

  const gameId = values.gameId > 0 ? values.gameId : fallbackGameId

  return {
    values: { ...values, gameId },
    canSubmit: values.pokemonName.trim() !== '' && gameId > 0,
    setField,
  }
}

export function genderOptions(): readonly PokemonGender[] {
  return ['male', 'female', 'genderless'] as const
}
