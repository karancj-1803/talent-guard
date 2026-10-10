import React, { useState, useEffect } from 'react'
import { RiskPriorityTable } from '../components/priorities/RiskPriorityTable'
import { EmployeeSearch } from '../components/priorities/EmployeeSearch'
import { priorityService } from '../services/priorityService'
import { reviewService } from '../services/reviewService'
import { runService } from '../services/runService'
import { Users, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'

export function PrioritiesPage() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Filter states
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('all')
  const [status, setStatus] = useState('all')

  const fetchPriorities = async () => {
    setIsLoading(true)
    try {
      const runs = await runService.listRuns()
      const activeRunId = runs.items?.[0]?.id || 'default'
      const res = await priorityService.getPriorities(activeRunId, {
        limit: 50,
        search,
        department,
        status
      })
      setItems(res.items || [])
    } catch (err) {
      console.error('Failed to load priorities:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPriorities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, department, status])

  const handleStatusChange = async (employeeRiskId, newStatus) => {
    // Optimistic UI update
    setItems(prev => prev.map(emp => {
      if (emp.id === employeeRiskId) {
        return {
          ...emp,
          review_status: newStatus,
          review: {
            ...emp.review,
            status: newStatus,
            updated_at: new Date().toISOString()
          }
        }
      }
      return emp
    }))

    try {
      await reviewService.updateReview(employeeRiskId, { status: newStatus })
    } catch (err) {
      console.error('Failed to update status:', err)
      // Revert if error
      fetchPriorities()
    }
  }

  const handleResetFilters = () => {
    setSearch('')
    setDepartment('all')
    setStatus('all')
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Top 50 Retention Priorities
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
              Capacity Quota: 50 Max
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Employees ranked in descending order of predicted attrition probability. Top 10 include prescriptive retention playbooks.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPriorities}
            className="text-xs h-9 gap-1.5"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload</span>
          </Button>
        </div>
      </div>

      {/* Interactive Search & Filter Toolbar */}
      <EmployeeSearch
        search={search}
        onSearchChange={setSearch}
        department={department}
        onDepartmentChange={setDepartment}
        status={status}
        onStatusChange={setStatus}
        onReset={handleResetFilters}
      />

      {/* Main Priority Table */}
      <RiskPriorityTable
        items={items}
        isLoading={isLoading}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
