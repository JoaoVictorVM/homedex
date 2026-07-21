import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { fetchCollection } from './collection.service.ts'
import type { Collection } from './collection.schema.ts'

export const collectionKeys = {
  detail: (code: string) => ['collection', code] as const,
}

export function useCollection(
  code: string | null,
): UseQueryResult<Collection, Error> {
  return useQuery({
    queryKey: collectionKeys.detail(code ?? ''),
    queryFn: ({ signal }) => {
      if (code === null) {
        throw new Error('coleção consultada sem código definido')
      }

      return fetchCollection(code, signal)
    },
    enabled: code !== null,
  })
}
