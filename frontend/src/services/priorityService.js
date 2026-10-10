import { request } from './apiClient'

export const priorityService = {
  async getPriorities(runId, { limit = 50, offset = 0, search = '', department = 'all', status = 'all' } = {}) {
    const params = new URLSearchParams()
    if (limit) params.set('limit', String(limit))
    if (offset) params.set('offset', String(offset))
    if (search && search.trim()) params.set('search', search.trim())
    if (department && department !== 'all') params.set('department', department)
    if (status && status !== 'all') params.set('status', status)

    const query = params.toString()
    const activeRunId = (runId && runId !== 'null' && runId !== 'undefined') ? runId : 'default'
    const endpoint = query ? `/runs/${activeRunId}/priorities?${query}` : `/runs/${activeRunId}/priorities`
    return await request(endpoint)
  },

  async getEmployeeDetail(runId, employeeRiskId) {
    if (runId && runId !== 'null' && runId !== 'undefined' && runId !== 'default') {
      return await request(`/runs/${runId}/employees/${employeeRiskId}`)
    }
    return await request(`/employees/${employeeRiskId}`)
  }
}
