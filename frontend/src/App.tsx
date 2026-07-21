import { useState } from 'react'
import type { JSX } from 'react'
import { EntryModal } from './features/collection/components/EntryModal/EntryModal.tsx'

export function App(): JSX.Element {
  const [code, setCode] = useState<string | null>(null)

  if (code === null) {
    return (
      <EntryModal
        onSubmitCode={setCode}
        onCreate={() => {
          setCode('')
        }}
      />
    )
  }

  return <h1>{code}</h1>
}
