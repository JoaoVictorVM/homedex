import type { JSX } from 'react'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import type { Game } from '../../game.schema.ts'
import { GameRow } from './GameRow.tsx'
import styles from './GamesModal.module.css'

type GameListProps = {
  code: string
  games: readonly Game[]
}

export function GameList({ code, games }: GameListProps): JSX.Element {
  const { t } = useI18n()

  if (games.length === 0) {
    return <p className={styles.empty}>{t('games.empty')}</p>
  }

  return (
    <ul className={styles.list}>
      {games.map((game) => (
        <GameRow key={game.id} code={code} game={game} />
      ))}
    </ul>
  )
}
