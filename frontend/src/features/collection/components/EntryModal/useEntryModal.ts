import { useCallback, useState } from 'react'
import { isValidCode, normalizeCode } from '../../code.ts'

export type EntryStep = 'choice' | 'code'

export type EntryModalState = {
  step: EntryStep
  code: string
  canSubmit: boolean
  goToCodeStep: () => void
  goToChoiceStep: () => void
  changeCode: (value: string) => void
  submitCode: () => void
}

export function useEntryModal(
  onSubmitCode: (code: string) => void,
): EntryModalState {
  const [step, setStep] = useState<EntryStep>('choice')
  const [code, setCode] = useState('')

  const goToCodeStep = useCallback(() => {
    setStep('code')
  }, [])

  const goToChoiceStep = useCallback(() => {
    setStep('choice')
    setCode('')
  }, [])

  const changeCode = useCallback((value: string) => {
    setCode(value.toUpperCase())
  }, [])

  const submitCode = useCallback(() => {
    if (isValidCode(code)) {
      onSubmitCode(normalizeCode(code))
    }
  }, [code, onSubmitCode])

  return {
    step,
    code,
    canSubmit: isValidCode(code),
    goToCodeStep,
    goToChoiceStep,
    changeCode,
    submitCode,
  }
}
