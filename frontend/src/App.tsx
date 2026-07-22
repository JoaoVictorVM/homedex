import { useState } from 'react'
import type { JSX } from 'react'
import { EntryModal } from './features/collection/components/EntryModal/EntryModal.tsx'
import { BoxScreen } from './features/box/components/BoxScreen/BoxScreen.tsx'
import { BoxContent } from './features/box/components/BoxContent/BoxContent.tsx'
import { PokemonDetail } from './features/pokemon/components/PokemonDetail/PokemonDetail.tsx'
import { LoadingScreen } from './shared/components/LoadingScreen/LoadingScreen.tsx'
import { useCollectionSession } from './features/collection/useCollectionSession.ts'
import { useCreateCollection } from './features/collection/useCreateCollection.ts'
import { collectionErrorKey } from './features/collection/errors.ts'

const currentBox = 1

export function App(): JSX.Element {
  const { session, enter, leave } = useCollectionSession()
  const createCollection = useCreateCollection(enter)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)

  if (session.status === 'ready') {
    const { code } = session.collection

    return (
      <BoxScreen
        code={code}
        onLeave={leave}
        detail={
          <PokemonDetail
            code={code}
            boxNumber={currentBox}
            slot={selectedSlot}
          />
        }
        box={
          <BoxContent
            code={code}
            boxNumber={currentBox}
            selectedSlot={selectedSlot}
            onSelect={setSelectedSlot}
          />
        }
      />
    )
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
