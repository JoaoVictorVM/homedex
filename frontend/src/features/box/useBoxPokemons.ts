import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { fetchBox } from '../pokemon/pokemon.service.ts'
import type { Pokemon } from '../pokemon/pokemon.schema.ts'

export const boxKeys = {
  list: (code: string, boxNumber: number) => ['box', code, boxNumber] as const,
}

export function useBoxPokemons(
  code: string,
  boxNumber: number,
): UseQueryResult<Pokemon[], Error> {
  return useQuery({
    queryKey: boxKeys.list(code, boxNumber),
    queryFn: ({ signal }) => fetchBox(code, boxNumber, signal),
  })
}
