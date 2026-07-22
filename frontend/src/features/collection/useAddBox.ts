import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult } from '@tanstack/react-query'
import { addBox } from './collection.service.ts'
import { collectionKeys } from './useCollection.ts'
import type { Collection } from './collection.schema.ts'

export function useAddBox(
  code: string,
  onAdded?: (boxNumber: number) => void,
): UseMutationResult<Collection, Error, void> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => addBox(code),
    onSuccess: (updated) => {
      queryClient.setQueryData(collectionKeys.detail(updated.code), updated)
      onAdded?.(updated.boxCount)
    },
  })
}
