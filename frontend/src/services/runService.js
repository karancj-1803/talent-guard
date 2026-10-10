import { request } from './apiClient'

export const runService = {
  async listRuns() {
    return await request('/runs')
  },

  async getRun(runId) {
    const targetId = runId || 'default'
    return await request(`/runs/${targetId}`)
  },

  async createRun(payload = {}) {
    return await request('/runs', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }
}
