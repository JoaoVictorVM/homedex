import { request } from '../../lib/api/client.ts'
import { collectionSchema } from './collection.schema.ts'
import type { Collection } from './collection.schema.ts'

export function createCollection(signal?: AbortSignal): Promise<Collection> {
  return request('/collections', {
    method: 'POST',
    schema: collectionSchema,
    signal,
  })
}

export function fetchCollection(
  code: string,
  signal?: AbortSignal,
): Promise<Collection> {
  return request(`/collections/${encodeURIComponent(code)}`, {
    schema: collectionSchema,
    signal,
  })
}
