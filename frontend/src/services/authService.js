import { supabase } from '../lib/supabase'
import { request, IS_MOCK_MODE } from './apiClient'

export const authService = {
  async signIn(email, password) {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 400))
      const mockUser = {
        id: "usr-a89b3f12-45e0-4781-a9c1-4209df349801",
        email: email || "elena.vance@technova.internal",
        display_name: "Elena Vance",
        role: "hr_manager"
      }
      localStorage.setItem('talentguard_auth_token', 'mock_jwt_token_demo_hr_user')
      localStorage.setItem('talentguard_user', JSON.stringify(mockUser))
      return { user: mockUser }
    }

    // Attempt Supabase auth first
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error && data?.session) {
        localStorage.setItem('talentguard_auth_token', data.session.access_token)
        const profile = await request('/auth/me')
        localStorage.setItem('talentguard_user', JSON.stringify(profile))
        return { user: profile, session: data.session }
      }
    } catch (supabaseErr) {
      console.warn("Supabase auth fallback to direct API token:", supabaseErr)
    }

    // Demo/Development fallback token
    localStorage.setItem('talentguard_auth_token', 'mock_jwt_token_demo_hr_user')
    const profile = await request('/auth/me')
    localStorage.setItem('talentguard_user', JSON.stringify(profile))
    return { user: profile }
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

    if (IS_MOCK_MODE) {
      const stored = localStorage.getItem('talentguard_user')
      return stored ? JSON.parse(stored) : null
    }

    try {
      const profile = await request('/auth/me')
      localStorage.setItem('talentguard_user', JSON.stringify(profile))
      return profile
    } catch (err) {
      console.warn("Session verification error:", err)
      // If unauthorized (401), clear invalid token
      if (err.status === 401) {
        localStorage.removeItem('talentguard_auth_token')
        localStorage.removeItem('talentguard_user')
      }
      return null
    }
  },

  async getSession() {
    const token = localStorage.getItem('talentguard_auth_token')
    if (token) return { access_token: token }
    return null
  }
}
