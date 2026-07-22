import { ApiError } from '../../lib/api/ApiError.ts'
import type { MessageKey } from '../../shared/i18n/messages/pt-BR.ts'

export function isMissingCollection(error: unknown): boolean {
  return error instanceof ApiError && error.isNotFound
}

export function collectionErrorKey(error: unknown): MessageKey {
  if (error instanceof ApiError) {
    if (error.isNotFound) {
      return 'entry.error.notFound'
    }
    if (error.kind === 'network') {
      return 'entry.error.network'
    }
    if (error.status === 400) {
      return 'entry.error.invalidCode'
    }
  }

  return 'entry.error.generic'
}
