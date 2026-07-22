import { useCallback, useState } from 'react'
import { clearStoredCode, readStoredCode, storeCode } from './storage.ts'

export type CurrentCode = {
  code: string | null
  restored: boolean
  enter: (code: string) => void
  leave: () => void
}

type CodeState = {
  code: string | null
  restored: boolean
}

function initialState(): CodeState {
  const stored = readStoredCode()

  return { code: stored, restored: stored !== null }
}

export function useCurrentCode(): CurrentCode {
  const [state, setState] = useState<CodeState>(initialState)

  const enter = useCallback((next: string) => {
    storeCode(next)
    setState({ code: next, restored: false })
  }, [])

  const leave = useCallback(() => {
    clearStoredCode()
    setState({ code: null, restored: false })
  }, [])

  return { code: state.code, restored: state.restored, enter, leave }
}
