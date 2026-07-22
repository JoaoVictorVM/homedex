import { useState } from 'react'
import type { JSX } from 'react'
import { EntryModal } from './features/collection/components/EntryModal/EntryModal.tsx'
import { BoxScreen } from './features/box/components/BoxScreen/BoxScreen.tsx'
import { BoxContent } from './features/box/components/BoxContent/BoxContent.tsx'
import { BoxNavigator } from './features/box/components/BoxNavigator/BoxNavigator.tsx'
import { PokemonDetail } from './features/pokemon/components/PokemonDetail/PokemonDetail.tsx'
import { AddPokemonModal } from './features/pokemon/components/AddPokemonModal/AddPokemonModal.tsx'
import { LoadingScreen } from './shared/components/LoadingScreen/LoadingScreen.tsx'
import { useCollectionSession } from './features/collection/useCollectionSession.ts'
import { useCreateCollection } from './features/collection/useCreateCollection.ts'
import { useAddBox } from './features/collection/useAddBox.ts'
import { collectionErrorKey } from './features/collection/errors.ts'

export function App(): JSX.Element {
  const { session, enter, leave } = useCollectionSession()
  const createCollection = useCreateCollection(enter)
  const [boxNumber, setBoxNumber] = useState(1)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [isAddingPokemon, setIsAddingPokemon] = useState(false)
  const currentCode = session.status === 'ready' ? session.collection.code : ''
  const addBox = useAddBox(currentCode, openBox)

  function openBox(next: number): void {
    setBoxNumber(next)
    setSelectedSlot(null)
  }

  if (session.status === 'ready') {
    const { code, boxCount } = session.collection

    return (
      <>
        <BoxScreen
          code={code}
          onLeave={leave}
          onAddPokemon={() => {
            setIsAddingPokemon(true)
          }}
          detail={
            <PokemonDetail
              code={code}
              boxNumber={boxNumber}
              slot={selectedSlot}
            />
          }
          box={
            <>
              <BoxNavigator
                boxNumber={boxNumber}
                boxCount={boxCount}
                onChange={openBox}
                onAddBox={() => {
                  addBox.mutate()
                }}
                isAddingBox={addBox.isPending}
              />
              <BoxContent
                code={code}
                boxNumber={boxNumber}
                selectedSlot={selectedSlot}
                onSelect={setSelectedSlot}
              />
            </>
          }
        />
        {isAddingPokemon && (
          <AddPokemonModal
            code={code}
            boxNumber={boxNumber}
            onClose={() => {
              setIsAddingPokemon(false)
            }}
          />
        )}
      </>
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
