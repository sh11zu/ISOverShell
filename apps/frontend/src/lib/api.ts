import { useAuthStore } from '../stores/auth'

/**
 * Authenticated fetch wrapper.
 * Adds the Authorization header automatically and handles 401 by clearing auth.
 */
export async function api(url: string, options: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().token

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401) {
    useAuthStore.getState().clearAuth()
    window.location.href = '/login'
  }

  return res
}

/** Shorthand for authenticated JSON POST/PATCH */
export function apiJson(url: string, method: string, body: unknown, options: RequestInit = {}) {
  return api(url, {
    ...options,
    method,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: JSON.stringify(body),
  })
}
