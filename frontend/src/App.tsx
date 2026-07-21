import { useState } from 'react'
import type { JSX } from 'react'
import { EntryModal } from './features/collection/components/EntryModal/EntryModal.tsx'
import { useCollection } from './features/collection/useCollection.ts'

export function App(): JSX.Element {
  const [code, setCode] = useState<string | null>(null)
  const collection = useCollection(code)

  if (collection.data !== undefined) {
    return <h1>{collection.data.code}</h1>
  }

  return <EntryModal onSubmitCode={setCode} isLoading={collection.isFetching} />
}
