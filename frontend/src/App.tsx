import type { JSX } from 'react'
import { EntryModal } from './features/collection/components/EntryModal/EntryModal.tsx'
import { LoadingScreen } from './shared/components/LoadingScreen/LoadingScreen.tsx'
import { useCollectionSession } from './features/collection/useCollectionSession.ts'
import { useCreateCollection } from './features/collection/useCreateCollection.ts'
import { collectionErrorKey } from './features/collection/errors.ts'

export function App(): JSX.Element {
  const { session, enter } = useCollectionSession()
  const createCollection = useCreateCollection(enter)

  if (session.status === 'ready') {
    return <h1>{session.collection.code}</h1>
  }

  if (session.status === 'restoring') {
    return <LoadingScreen />
  }

  const failure = session.error ?? createCollection.error

  return (
    <EntryModal
      onSubmitCode={enter}
      onCreate={() => {
        createCollection.mutate()
      }}
      isLoading={session.isSearching || createCollection.isPending}
      errorKey={failure === null ? null : collectionErrorKey(failure)}
    />
  )
}
