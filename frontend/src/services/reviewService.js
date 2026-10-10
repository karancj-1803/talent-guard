import { request } from './apiClient'

const ALLOWED_STATUSES = ['pending', 'reviewed', 'action_planned', 'closed']

export const reviewService = {
  async updateReview(employeeRiskId, { status, notes }) {
    if (!ALLOWED_STATUSES.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${ALLOWED_STATUSES.join(', ')}`)
    }

    if (notes && notes.length > 2000) {
      throw new Error('Review notes must not exceed 2,000 characters.')
    }

    return await request(`/employee-risks/${employeeRiskId}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes })
    })
  }
}
