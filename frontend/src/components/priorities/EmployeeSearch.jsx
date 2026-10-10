import React from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

const DEPARTMENTS = [
  { value: 'all', label: 'All Departments' },
  { value: 'Research & Development', label: 'Research & Development' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Human Resources', label: 'Human Resources' },
]

const STATUS_FILTERS = [
  { value: 'all', label: 'All Review Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'action_planned', label: 'Action Planned' },
  { value: 'closed', label: 'Closed' },
]

export function EmployeeSearch({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  status,
  onStatusChange,
  onReset
}) {
  const hasActiveFilters = search || department !== 'all' || status !== 'all'

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by employee name, ID (e.g. EMP-1017), or role..."
          className="pl-9 bg-slate-50/50 border-slate-200 focus:bg-white text-xs h-9.5"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Department Filter */}
      <div className="w-full md:w-56 shrink-0">
        <select
          value={department}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="w-full text-xs h-9.5 rounded-lg border border-slate-200 bg-slate-50/50 px-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
        >
          {DEPARTMENTS.map(d => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Review Status Filter */}
      <div className="w-full md:w-48 shrink-0">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full text-xs h-9.5 rounded-lg border border-slate-200 bg-slate-50/50 px-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
        >
          {STATUS_FILTERS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-9.5 text-xs text-slate-500 hover:text-slate-800 shrink-0"
        >
          Clear
        </Button>
      )}
    </div>
  )
}
