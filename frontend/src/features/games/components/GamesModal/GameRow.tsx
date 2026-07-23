import { useState } from 'react'
import type { FormEvent, JSX } from 'react'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import { Button } from '../../../../shared/components/Button/Button.tsx'
import { ConfirmDialog } from '../../../../shared/components/ConfirmDialog/ConfirmDialog.tsx'
import { useToggleGameVisibility } from '../../useToggleGameVisibility.ts'
import {
  useDeleteHackrom,
  useRenameHackrom,
} from '../../useHackromMutations.ts'
import { EyeIcon } from './EyeIcon.tsx'
import type { Game } from '../../game.schema.ts'
import styles from './GameRow.module.css'

type GameRowProps = {
  code: string
  game: Game
}

export function GameRow({ code, game }: GameRowProps): JSX.Element {
  const { t } = useI18n()
  const toggle = useToggleGameVisibility(code)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  return (
    <li className={styles.row}>
      {editing ? (
        <RenameForm
          code={code}
          game={game}
          onDone={() => {
            setEditing(false)
          }}
        />
      ) : (
        <>
          <span
            className={`${styles.name} ${game.visible ? '' : styles.hidden}`}
          >
            {game.name}
          </span>

          <div className={styles.actions}>
            {!game.isOfficial && (
              <button
                className={styles.action}
                type="button"
                aria-label={t('hackrom.rename')}
                onClick={() => {
                  setEditing(true)
                }}
              >
                {'✎'}
              </button>
            )}

            <button
              className={`${styles.toggle} ${game.visible ? '' : styles.toggleOff}`}
              type="button"
              aria-label={game.visible ? t('games.hide') : t('games.show')}
              aria-pressed={!game.visible}
              disabled={toggle.isPending}
              onClick={() => {
                toggle.mutate({ gameId: game.id, visible: !game.visible })
              }}
            >
              <EyeIcon crossed={!game.visible} />
            </button>

            {!game.isOfficial && (
              <button
                className={styles.action}
                type="button"
                aria-label={t('hackrom.delete')}
                onClick={() => {
                  setConfirming(true)
                }}
              >
                {'🗑'}
              </button>
            )}
          </div>
        </>
      )}

      {confirming && (
        <DeleteDialog
          code={code}
          game={game}
          onDone={() => {
            setConfirming(false)
          }}
        />
      )}
    </li>
  )
}

function RenameForm({
  code,
  game,
  onDone,
}: {
  code: string
  game: Game
  onDone: () => void
}): JSX.Element {
  const { t } = useI18n()
  const [name, setName] = useState(game.name)
  const rename = useRenameHackrom(code, onDone)

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const trimmed = name.trim()

    if (trimmed === '' || trimmed === game.name) {
      onDone()
      return
    }

    rename.mutate({ gameId: game.id, name: trimmed })
  }

  return (
    <form className={styles.renameForm} onSubmit={handleSubmit}>
      <div className={styles.renameRow}>
        <input
          className={styles.renameInput}
          value={name}
          onChange={(event) => {
            setName(event.target.value)
          }}
          aria-label={t('hackrom.rename')}
          autoComplete="off"
          maxLength={60}
          autoFocus
        />
        <Button type="submit" disabled={rename.isPending}>
          {t('hackrom.save')}
        </Button>
        <Button
          variant="secondary"
          onClick={onDone}
          disabled={rename.isPending}
        >
          {t('common.cancel')}
        </Button>
      </div>
      {rename.error !== null && (
        <p className={styles.renameError} role="alert">
          {rename.error.message}
        </p>
      )}
    </form>
  )
}

function DeleteDialog({
  code,
  game,
  onDone,
}: {
  code: string
  game: Game
  onDone: () => void
}): JSX.Element {
  const { t } = useI18n()
  const remove = useDeleteHackrom(code, onDone)

  return (
    <ConfirmDialog
      title={t('hackrom.deleteTitle')}
      message={t('hackrom.deleteMessage', { name: game.name })}
      confirmLabel={t('hackrom.delete')}
      errorMessage={remove.error === null ? undefined : remove.error.message}
      isPending={remove.isPending}
      onConfirm={() => {
        remove.mutate(game.id)
      }}
      onCancel={onDone}
    />
  )
}
