const fallbackBaseUrl = 'http://localhost:8080'

export function apiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL

  if (typeof configured === 'string' && configured !== '') {
    return configured.replace(/\/+$/, '')
  }

  return fallbackBaseUrl
}
