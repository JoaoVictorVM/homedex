import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult } from '@tanstack/react-query'
import { createCollection } from './collection.service.ts'
import { collectionKeys } from './useCollection.ts'
import type { Collection } from './collection.schema.ts'

export function useCreateCollection(
  onCreated: (code: string) => void,
): UseMutationResult<Collection, Error, void> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => createCollection(),
    onSuccess: (created) => {
      queryClient.setQueryData(collectionKeys.detail(created.code), created)
      onCreated(created.code)
    },
  })
}
