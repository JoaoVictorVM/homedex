import type { JSX } from 'react'
import type { Game } from '../../game.schema.ts'
import styles from './GameRow.module.css'

type GameRowProps = {
  code: string
  game: Game
}

export function GameRow({ game }: GameRowProps): JSX.Element {
  return (
    <li className={styles.row}>
      <span className={`${styles.name} ${game.visible ? '' : styles.hidden}`}>
        {game.name}
      </span>
    </li>
  )
}
