import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiBaseUrl } from './config.ts'

describe('apiBaseUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('usa o backend local quando nada está configurado', () => {
    vi.stubEnv('VITE_API_URL', '')

    expect(apiBaseUrl()).toBe('http://localhost:8080')
  })

  it('usa a URL configurada no ambiente', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.homedex.app')

    expect(apiBaseUrl()).toBe('https://api.homedex.app')
  })

  it('remove barras finais da URL configurada', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.homedex.app///')

    expect(apiBaseUrl()).toBe('https://api.homedex.app')
  })
})
