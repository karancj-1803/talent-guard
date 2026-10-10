import { supabase } from '../lib/supabase'
import { request, IS_MOCK_MODE } from './apiClient'

export const authService = {
  async signIn(email, password) {
    if (IS_MOCK_MODE) {
      throw new Error("Mock mode is disabled. Please authenticate with Supabase credentials.")
    }

    // Real Supabase Auth authentication
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data?.session) {
      throw new Error(error?.message || "Invalid email or password.")
    }

    // Persist session access token
    const token = data.session.access_token
    localStorage.setItem('talentguard_auth_token', token)

    // Verify token with backend /auth/me and derive authenticated user identity
    try {
      const profile = await request('/auth/me')
      localStorage.setItem('talentguard_user', JSON.stringify(profile))
      return { user: profile, session: data.session }
    } catch (backendErr) {
      localStorage.removeItem('talentguard_auth_token')
      throw new Error(`Backend identity verification failed: ${backendErr.message}`, { cause: backendErr })
    }
  },

  async signOut() {
    localStorage.removeItem('talentguard_auth_token')
    localStorage.removeItem('talentguard_user')
    try {
      await supabase.auth.signOut()
    } catch (_e) {
      // Ignore
    }
    return true
  },

  async getCurrentUser() {
    const token = localStorage.getItem('talentguard_auth_token')
    if (!token) return null

    try {
      // Validate token with backend /auth/me
      const profile = await request('/auth/me')
      localStorage.setItem('talentguard_user', JSON.stringify(profile))
      return profile
    } catch (err) {
      console.warn("Session verification failed:", err)
      localStorage.removeItem('talentguard_auth_token')
      localStorage.removeItem('talentguard_user')
      return null
    }
  },

  async getSession() {
    const token = localStorage.getItem('talentguard_auth_token')
    if (token) return { access_token: token }
    return null
  }
}
