import { request, IS_MOCK_MODE } from './apiClient'
import { getStoredRuns, saveStoredRuns, MOCK_DATASET_SUMMARY, MOCK_EXCLUDED_COLUMNS, MOCK_METRICS } from '../data/mockData'

export const runService = {
  async listRuns() {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 300))
      const runs = getStoredRuns()
      return {
        items: runs.map(r => ({
          id: r.id,
          status: r.status,
          model_name: r.model_name,
          selected_count: r.selected_count,
          created_at: r.created_at
        })),
        total: runs.length
      }
    }
    return await request('/runs')
  },

  async getRun(runId) {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 300))
      const runs = getStoredRuns()
      const found = runId ? runs.find(r => r.id === runId) : runs[0]
      if (!found) throw new Error(`Run ${runId} not found`)
      return found
    }
    return await request(`/runs/${runId}`)
  },

  async createRun(payload = {}) {
    if (IS_MOCK_MODE) {
      // Simulate realistic model training and validation duration
      await new Promise(r => setTimeout(r, 1400))
      
      const runs = getStoredRuns()
      const newId = `run-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
      
      const newRun = {
        id: newId,
        status: "completed",
        model_name: "logistic_regression",
        dataset_name: payload.dataset_source || "WA_Fn-UseC_-HR-Employee-Attrition.csv",
        selected_count: 50,
        created_at: new Date().toISOString(),
        dataset_summary: { ...MOCK_DATASET_SUMMARY },
        excluded_columns: MOCK_EXCLUDED_COLUMNS.map(c => c.name),
        metrics: {
          ...MOCK_METRICS,
          roc_auc: Number((0.835 + Math.random() * 0.015).toFixed(4)),
          average_precision: Number((0.585 + Math.random() * 0.015).toFixed(4)),
          evaluation_date: new Date().toISOString()
        },
        validation_summary: {
          is_valid: true,
          validation_status: "passed",
          checks: [
            { check: "Required Target Column Present", status: "passed", details: "Attrition present in dataset" },
            { check: "Binary Target Validated", status: "passed", details: "Distinct values: ['Yes', 'No']" },
            { check: "Missing Values Check", status: "passed", details: "0 null cells across 1,470 rows" },
            { check: "Minimum Row Count (>= 500)", status: "passed", details: "1,470 records available" },
            { check: "Identifier Sanitization", status: "passed", details: "Excluded EmployeeNumber and 3 constant features" }
          ]
        }
      }

      runs.unshift(newRun)
      saveStoredRuns(runs)
      return newRun
    }

    return await request('/runs', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }
}
