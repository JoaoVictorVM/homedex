import { useState } from 'react'
import type { FormEvent, JSX } from 'react'
import { Button } from '../../../../shared/components/Button/Button.tsx'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import { useCreateHackrom } from '../../useHackromMutations.ts'
import styles from './HackromForm.module.css'

export function HackromForm({ code }: { code: string }): JSX.Element {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const create = useCreateHackrom(code, () => {
    setName('')
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    if (name.trim() === '') {
      return
    }

    create.mutate(name.trim())
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <input
          className={styles.input}
          value={name}
          onChange={(event) => {
            setName(event.target.value)
          }}
          placeholder={t('hackrom.namePlaceholder')}
          aria-label={t('hackrom.nameLabel')}
          autoComplete="off"
          maxLength={60}
        />
        <Button type="submit" disabled={name.trim() === '' || create.isPending}>
          {create.isPending ? t('common.loading') : t('hackrom.add')}
        </Button>
      </div>
      {create.error !== null && (
        <p className={styles.error} role="alert">
          {create.error.message}
        </p>
      )}
    </form>
  )
}
