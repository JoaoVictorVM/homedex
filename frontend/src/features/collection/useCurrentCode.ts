import { useCallback, useState } from 'react'
import { clearStoredCode, readStoredCode, storeCode } from './storage.ts'

export type CurrentCode = {
  code: string | null
  enter: (code: string) => void
  leave: () => void
}

export function useCurrentCode(): CurrentCode {
  const [code, setCode] = useState<string | null>(readStoredCode)

  const enter = useCallback((next: string) => {
    storeCode(next)
    setCode(next)
  }, [])

  const leave = useCallback(() => {
    clearStoredCode()
    setCode(null)
  }, [])

  return { code, enter, leave }
}
