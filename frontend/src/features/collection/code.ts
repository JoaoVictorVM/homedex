const codeAlphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const codeSeparator = '-'

export const codeLength = 8

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replaceAll(codeSeparator, '')
}

export function isValidCode(raw: string): boolean {
  const code = normalizeCode(raw)

  if (code.length !== codeLength) {
    return false
  }

  return [...code].every((character) => codeAlphabet.includes(character))
}
