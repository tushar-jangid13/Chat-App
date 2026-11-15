const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('tchat-token')
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status})`)
  }

  return data
}

export const api = {
  get: (path) => apiRequest(path),
  post: (path, body) => apiRequest(path, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  patch: (path, body) => apiRequest(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
}
