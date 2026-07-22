import type { JSX } from 'react'
import { EntryModal } from './features/collection/components/EntryModal/EntryModal.tsx'
import { CollectionCode } from './features/collection/components/CollectionCode/CollectionCode.tsx'
import { LoadingScreen } from './shared/components/LoadingScreen/LoadingScreen.tsx'
import { Button } from './shared/components/Button/Button.tsx'
import { useCollectionSession } from './features/collection/useCollectionSession.ts'
import { useCreateCollection } from './features/collection/useCreateCollection.ts'
import { collectionErrorKey } from './features/collection/errors.ts'
import { useI18n } from './shared/i18n/useI18n.ts'
import styles from './App.module.css'

export function App(): JSX.Element {
  const { t } = useI18n()
  const { session, enter, leave } = useCollectionSession()
  const createCollection = useCreateCollection(enter)

  if (session.status === 'ready') {
    return (
      <main className={styles.screen}>
        <div className={styles.panel}>
          <CollectionCode code={session.collection.code} />
          <Button variant="secondary" onClick={leave}>
            {t('collection.leave')}
          </Button>
        </div>
      </main>
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
