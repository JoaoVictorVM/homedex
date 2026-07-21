import type { ZodType } from 'zod'
import { ApiError } from './ApiError.ts'
import { apiBaseUrl } from './config.ts'

type RequestOptions<T> = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  schema: ZodType<T>
  signal?: AbortSignal
}

export async function request<T>(
  path: string,
  options: RequestOptions<T>,
): Promise<T> {
  const response = await send(path, options)
  const payload: unknown = await readJson(response)

  const parsed = options.schema.safeParse(payload)
  if (!parsed.success) {
    throw new ApiError('resposta do servidor em formato inesperado', {
      kind: 'parse',
      status: response.status,
      cause: parsed.error,
    })
  }

  return parsed.data
}

export async function requestEmpty(
  path: string,
  options: Omit<RequestOptions<never>, 'schema'>,
): Promise<void> {
  await send(path, options)
}

async function send(
  path: string,
  options: Omit<RequestOptions<never>, 'schema'>,
): Promise<Response> {
  const { method = 'GET', body, signal } = options

  let response: Response
  try {
    response = await fetch(apiBaseUrl() + path, {
      method,
      signal,
      headers:
        body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (cause) {
    throw new ApiError('não foi possível conectar ao servidor', {
      kind: 'network',
      cause,
    })
  }

  if (!response.ok) {
    throw new ApiError(await errorMessage(response), {
      kind: response.status >= 500 ? 'server' : 'client',
      status: response.status,
    })
  }

  return response
}

async function readJson(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null
  }

  try {
    return await response.json()
  } catch (cause) {
    throw new ApiError('resposta do servidor não é um JSON válido', {
      kind: 'parse',
      status: response.status,
      cause,
    })
  }
}

async function errorMessage(response: Response): Promise<string> {
  const fallback = `erro ${response.status} ao chamar o servidor`

  try {
    const body: unknown = await response.json()

    if (typeof body === 'object' && body !== null && 'error' in body) {
      const message: unknown = body.error
      if (typeof message === 'string' && message !== '') {
        return message
      }
    }
  } catch {
    return fallback
  }

  return fallback
}
