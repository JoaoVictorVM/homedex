import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { fetchForms } from './pokemon.service.ts'
import { useDebouncedValue } from '../../shared/useDebouncedValue.ts'

const debounceMs = 400

export const formsKeys = {
  list: (name: string) => ['pokemon-forms', name] as const,
}

export function usePokemonForms(name: string): UseQueryResult<string[], Error> {
  const debouncedName = useDebouncedValue(name.trim(), debounceMs)

  return useQuery({
    queryKey: formsKeys.list(debouncedName),
    queryFn: ({ signal }) => fetchForms(debouncedName, signal),
    enabled: debouncedName !== '',
    retry: false,
  })
}
