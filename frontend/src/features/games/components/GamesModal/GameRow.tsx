import type { JSX } from 'react'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import { useToggleGameVisibility } from '../../useToggleGameVisibility.ts'
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

  return (
    <li className={styles.row}>
      <span className={`${styles.name} ${game.visible ? '' : styles.hidden}`}>
        {game.name}
      </span>

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
    </li>
  )
}
