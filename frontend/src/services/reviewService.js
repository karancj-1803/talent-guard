import { request, IS_MOCK_MODE } from './apiClient'
import { saveReviewLocal } from '../data/mockData'

const ALLOWED_STATUSES = ['pending', 'reviewed', 'action_planned', 'closed']

export const reviewService = {
  async updateReview(employeeRiskId, { status, notes }) {
    if (!ALLOWED_STATUSES.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${ALLOWED_STATUSES.join(', ')}`)
    }

    if (notes && notes.length > 2000) {
      throw new Error('Review notes must not exceed 2,000 characters.')
    }

    if (IS_MOCK_MODE) {
      // Simulate network request
      await new Promise(r => setTimeout(r, 400))
      const record = saveReviewLocal(employeeRiskId, status, notes)
      return {
        employee_risk_id: employeeRiskId,
        status: record.status,
        notes: record.notes,
        updated_at: record.updated_at
      }
    }

    return await request(`/employee-risks/${employeeRiskId}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes })
    })
  }
}
