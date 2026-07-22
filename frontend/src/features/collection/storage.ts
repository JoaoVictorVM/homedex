import { isValidCode, normalizeCode } from './code.ts'

const storageKey = 'homedex.code'

export function readStoredCode(): string | null {
  const stored = localStorage.getItem(storageKey)

  if (stored === null || !isValidCode(stored)) {
    return null
  }

  return normalizeCode(stored)
}

export function storeCode(code: string): void {
  localStorage.setItem(storageKey, code)
}

export function clearStoredCode(): void {
  localStorage.removeItem(storageKey)
}
