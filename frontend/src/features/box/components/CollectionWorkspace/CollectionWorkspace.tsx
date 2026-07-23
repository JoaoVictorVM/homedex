import { useState } from 'react'
import type { JSX } from 'react'
import { BoxScreen } from '../BoxScreen/BoxScreen.tsx'
import { BoxContent } from '../BoxContent/BoxContent.tsx'
import { BoxNavigator } from '../BoxNavigator/BoxNavigator.tsx'
import { PokemonDetail } from '../../../pokemon/components/PokemonDetail/PokemonDetail.tsx'
import { AddPokemonModal } from '../../../pokemon/components/AddPokemonModal/AddPokemonModal.tsx'
import { EditPokemonModal } from '../../../pokemon/components/EditPokemonModal/EditPokemonModal.tsx'
import { ConfirmDialog } from '../../../../shared/components/ConfirmDialog/ConfirmDialog.tsx'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import { useAddBox } from '../../../collection/useAddBox.ts'
import { useDeletePokemon } from '../../../pokemon/useDeletePokemon.ts'
import type { Pokemon } from '../../../pokemon/pokemon.schema.ts'

type CollectionWorkspaceProps = {
  code: string
  boxCount: number
  onLeave: () => void
}

export function CollectionWorkspace({
  code,
  boxCount,
  onLeave,
}: CollectionWorkspaceProps): JSX.Element {
  const { t } = useI18n()
  const [boxNumber, setBoxNumber] = useState(1)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editing, setEditing] = useState<Pokemon | null>(null)
  const [removing, setRemoving] = useState<Pokemon | null>(null)

  const addBox = useAddBox(code, openBox)
  const deletePokemon = useDeletePokemon(code, boxNumber, () => {
    setRemoving(null)
    setSelectedSlot(null)
  })

  function openBox(next: number): void {
    setBoxNumber(next)
    setSelectedSlot(null)
  }

  return (
    <>
      <BoxScreen
        code={code}
        onLeave={onLeave}
        onAddPokemon={() => {
          setIsAdding(true)
        }}
        detail={
          <PokemonDetail
            code={code}
            boxNumber={boxNumber}
            slot={selectedSlot}
            onEdit={setEditing}
            onRemove={setRemoving}
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

      {isAdding && (
        <AddPokemonModal
          code={code}
          boxNumber={boxNumber}
          onClose={() => {
            setIsAdding(false)
          }}
        />
      )}

      {editing !== null && (
        <EditPokemonModal
          code={code}
          boxNumber={boxNumber}
          pokemon={editing}
          onClose={() => {
            setEditing(null)
          }}
        />
      )}

      {removing !== null && (
        <ConfirmDialog
          title={t('removePokemon.title')}
          message={t('removePokemon.message', {
            name:
              removing.nickname === ''
                ? removing.pokemonName
                : removing.nickname,
          })}
          confirmLabel={t('removePokemon.confirm')}
          errorMessage={
            deletePokemon.error === null ? undefined : t('removePokemon.error')
          }
          isPending={deletePokemon.isPending}
          onConfirm={() => {
            deletePokemon.mutate(removing.id)
          }}
          onCancel={() => {
            setRemoving(null)
          }}
        />
      )}
    </>
  )
}
