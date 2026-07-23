import { useState } from 'react'
import type { JSX } from 'react'
import { Modal } from '../../../../shared/components/Modal/Modal.tsx'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import { useGames } from '../../useGames.ts'
import { GameList } from './GameList.tsx'
import { HackromForm } from './HackromForm.tsx'
import styles from './GamesModal.module.css'

type GamesModalProps = {
  code: string
  onClose: () => void
}

type Tab = 'official' | 'hackrom'

export function GamesModal({ code, onClose }: GamesModalProps): JSX.Element {
  const { t } = useI18n()
  const games = useGames(code)
  const [tab, setTab] = useState<Tab>('official')

  const official = (games.data ?? []).filter((game) => game.isOfficial)
  const hackroms = (games.data ?? []).filter((game) => !game.isOfficial)

  return (
    <Modal title={t('games.title')} onClose={onClose}>
      <div className={styles.content}>
        <div className={styles.tabs} role="tablist">
          <button
            className={`${styles.tab} ${tab === 'official' ? styles.tabActive : ''}`}
            type="button"
            role="tab"
            aria-selected={tab === 'official'}
            onClick={() => {
              setTab('official')
            }}
          >
            {t('games.official')}
          </button>
          <button
            className={`${styles.tab} ${tab === 'hackrom' ? styles.tabActive : ''}`}
            type="button"
            role="tab"
            aria-selected={tab === 'hackrom'}
            onClick={() => {
              setTab('hackrom')
            }}
          >
            {t('games.hackrom')}
          </button>
        </div>

        {games.isLoading && (
          <p className={styles.message} role="status">
            {t('common.loading')}
          </p>
        )}
        {games.isError && (
          <p className={styles.message} role="alert">
            {t('games.loadError')}
          </p>
        )}

        {games.data !== undefined &&
          (tab === 'official' ? (
            <GameList code={code} games={official} />
          ) : (
            <>
              <HackromForm code={code} />
              <GameList code={code} games={hackroms} />
            </>
          ))}
      </div>
    </Modal>
  )
}
