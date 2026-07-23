import type { JSX } from 'react'
import { useI18n } from '../../../../shared/i18n/useI18n.ts'
import { usePokemonForms } from '../../usePokemonForms.ts'
import styles from './AddPokemonModal.module.css'

type FormSelectProps = {
  name: string
  value: string
  onChange: (form: string) => void
}

export function FormSelect({
  name,
  value,
  onChange,
}: FormSelectProps): JSX.Element | null {
  const { t } = useI18n()
  const forms = usePokemonForms(name)
  const options = forms.data ?? []

  if (options.length <= 1) {
    return null
  }

  return (
    <label className={styles.field}>
      {t('addPokemon.formLabel')}
      <select
        className={styles.select}
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
      >
        <option value="">{t('addPokemon.defaultForm')}</option>
        {options.slice(1).map((form) => (
          <option key={form} value={form}>
            {form}
          </option>
        ))}
      </select>
    </label>
  )
}
