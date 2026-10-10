// Centralized API client conforming to PRD section 3.4 error specifications

let rawBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').trim()
if (!rawBase.endsWith('/api/v1')) {
  rawBase = `${rawBase.replace(/\/+$/, '')}/api/v1`
}
export const API_BASE_URL = rawBase

// Mock mode set to FALSE for Phase 3 Live Backend Integration
export const IS_MOCK_MODE = false

export class ApiError extends Error {
  constructor(message, status, code = 'API_ERROR', details = null) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
    this.name = 'ApiError'
  }
}

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('talentguard_auth_token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  try {
    const res = await fetch(url, { ...options, headers })
    
    if (!res.ok) {
      let errorData = null
      try {
        errorData = await res.json()
      } catch {
        // Fallback for non-JSON response
      }

      const errObj = errorData?.error || {}
      throw new ApiError(
        errObj.message || `HTTP ${res.status}: ${res.statusText}`,
        res.status,
        errObj.code || 'HTTP_ERROR',
        errObj.details
      )
    }

    return await res.json()
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw new ApiError(err.message || 'Network request failed. Is the FastAPI backend running?', 0, 'NETWORK_ERROR')
  }
}
