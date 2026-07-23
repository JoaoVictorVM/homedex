import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { fetchSprite } from './pokemon.service.ts'
import { useDebouncedValue } from '../../shared/useDebouncedValue.ts'

const debounceMs = 400

export const spriteKeys = {
  preview: (name: string, form: string, shiny: boolean) =>
    ['sprite', name, form, shiny] as const,
}

export function useSpritePreview(
  name: string,
  form: string,
  shiny: boolean,
): UseQueryResult<string, Error> {
  const debouncedName = useDebouncedValue(name.trim(), debounceMs)
  const debouncedForm = useDebouncedValue(form.trim(), debounceMs)

  return useQuery({
    queryKey: spriteKeys.preview(debouncedName, debouncedForm, shiny),
    queryFn: ({ signal }) =>
      fetchSprite(debouncedName, debouncedForm, shiny, signal),
    enabled: debouncedName !== '',
    retry: false,
  })
}
