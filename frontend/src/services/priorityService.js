import { request, IS_MOCK_MODE } from './apiClient'
import { generateMockPriorities, getStoredReviews, getStoredRuns } from '../data/mockData'

export const priorityService = {
  async getPriorities(runId, { limit = 50, offset = 0, search = '', department = 'all', status = 'all' } = {}) {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 250))
      const runs = getStoredRuns()
      const activeRunId = runId || runs[0]?.id || 'default-run'
      
      let all = generateMockPriorities(activeRunId)
      const reviews = getStoredReviews()

      // Overlay local reviews if saved
      all = all.map(emp => {
        const rev = reviews[emp.id]
        if (rev) {
          return {
            ...emp,
            review_status: rev.status,
            review: {
              status: rev.status,
              notes: rev.notes,
              updated_at: rev.updated_at
            }
          }
        }
        return emp
      })

      // Filter by search query
      if (search && search.trim()) {
        const q = search.toLowerCase().trim()
        all = all.filter(emp => 
          emp.employee_key.toLowerCase().includes(q) ||
          emp.employee_name.toLowerCase().includes(q) ||
          emp.job_role.toLowerCase().includes(q) ||
          emp.department.toLowerCase().includes(q)
        )
      }

      // Filter by department
      if (department && department !== 'all') {
        all = all.filter(emp => emp.department === department)
      }

      // Filter by review status
      if (status && status !== 'all') {
        all = all.filter(emp => emp.review_status === status)
      }

      const total = all.length
      const paged = all.slice(offset, offset + limit)

      return {
        run_id: activeRunId,
        items: paged,
        total: total,
        limit,
        offset
      }
    }

    const query = new URLSearchParams({ limit, offset, search, department, status }).toString()
    return await request(`/runs/${runId}/priorities?${query}`)
  },

  async getEmployeeDetail(runId, employeeRiskId) {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 200))
      const priorities = generateMockPriorities(runId || 'default-run')
      const emp = priorities.find(p => p.id === employeeRiskId || p.employee_key === employeeRiskId)
      
      if (!emp) {
        throw new Error(`Employee record ${employeeRiskId} not found`)
      }

      const reviews = getStoredReviews()
      const rev = reviews[emp.id]

      return {
        id: emp.id,
        run_id: emp.run_id,
        employee_key: emp.employee_key,
        employee_name: emp.employee_name,
        risk_rank: emp.risk_rank,
        risk_probability: emp.risk_probability,
        department: emp.department,
        job_role: emp.job_role,
        overtime: emp.overtime,
        employee_attributes: emp.employee_attributes,
        risk_reasons: emp.risk_reasons,
        recommendations: emp.recommendations,
        review: rev ? {
          status: rev.status,
          notes: rev.notes,
          updated_at: rev.updated_at
        } : emp.review
      }
    }

    return await request(`/runs/${runId}/employees/${employeeRiskId}`)
  }
}
