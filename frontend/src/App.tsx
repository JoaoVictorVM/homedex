import type { JSX } from 'react'
import { EntryModal } from './features/collection/components/EntryModal/EntryModal.tsx'
import { LoadingScreen } from './shared/components/LoadingScreen/LoadingScreen.tsx'
import { useCollection } from './features/collection/useCollection.ts'
import { useCreateCollection } from './features/collection/useCreateCollection.ts'
import { useCurrentCode } from './features/collection/useCurrentCode.ts'

export function App(): JSX.Element {
  const { code, restored, enter } = useCurrentCode()
  const collection = useCollection(code)
  const createCollection = useCreateCollection(enter)

  if (collection.data !== undefined) {
    return <h1>{collection.data.code}</h1>
  }

  if (restored && collection.isLoading) {
    return <LoadingScreen />
  }

  return (
    <EntryModal
      onSubmitCode={enter}
      onCreate={() => {
        createCollection.mutate()
      }}
      isLoading={collection.isFetching || createCollection.isPending}
    />
  )
}
