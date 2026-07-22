import { useEffect } from 'react'
import { useCollection } from './useCollection.ts'
import { useCurrentCode } from './useCurrentCode.ts'
import { isMissingCollection } from './errors.ts'
import { clearStoredCode } from './storage.ts'
import type { Collection } from './collection.schema.ts'

export type CollectionSession =
  | { status: 'entry'; error: Error | null; isSearching: boolean }
  | { status: 'restoring' }
  | { status: 'ready'; collection: Collection }

export type CollectionSessionResult = {
  session: CollectionSession
  enter: (code: string) => void
  leave: () => void
}

export function useCollectionSession(): CollectionSessionResult {
  const { code, restored, enter, leave } = useCurrentCode()
  const collection = useCollection(code)

  const failure = collection.error ?? collection.failureReason
  const missingRestored = restored && isMissingCollection(failure)

  useEffect(() => {
    if (missingRestored) {
      clearStoredCode()
    }
  }, [missingRestored])

  return { session: currentSession(), enter, leave }

  function currentSession(): CollectionSession {
    if (collection.data !== undefined) {
      return { status: 'ready', collection: collection.data }
    }

    if (restored && collection.isLoading) {
      return { status: 'restoring' }
    }

    return {
      status: 'entry',
      error: failure,
      isSearching: collection.isFetching,
    }
  }
}
