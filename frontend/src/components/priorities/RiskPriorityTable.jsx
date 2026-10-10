import React from 'react'
import { Link } from 'react-router-dom'
import { RiskRank, RiskProbabilityBadge } from './RiskProbabilityBadge'
import { ReviewStatusSelect } from './ReviewStatusSelect'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { ChevronRight, UserX } from 'lucide-react'

export function RiskPriorityTable({
  items = [],
  isLoading,
  onStatusChange,
  emptyMessage = "No prioritized employees match the search filter."
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-6 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 flex-1" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <UserX className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-slate-800">No Matching Records</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold select-none">
            <tr>
              <th className="py-3 px-3.5 text-center w-16">Rank</th>
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Department & Role</th>
              <th className="py-3 px-4 text-center">Overtime</th>
              <th className="py-3 px-4 text-center">Risk Prob</th>
              <th className="py-3 px-4">Strongest Model Signals (Evidence)</th>
              <th className="py-3 px-4 text-center">Review Decision</th>
              <th className="py-3 px-4 text-right">Intervention</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((emp) => {
              return (
                <tr
                  key={emp.id}
                  className="hover:bg-slate-50/90 transition-colors group"
                >
                  {/* Rank */}
                  <td className="py-3.5 px-3.5 text-center">
                    <RiskRank rank={emp.risk_rank} />
                  </td>

                  {/* Employee Name & Key */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {emp.employee_name || emp.employee_key}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {emp.employee_key}
                    </div>
                  </td>

                  {/* Department & Role */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">{emp.job_role}</div>
                    <div className="text-[11px] text-slate-500">{emp.department}</div>
                  </td>

                  {/* Overtime */}
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                      emp.overtime === 'Yes' 
                        ? 'bg-red-50 text-red-700 border border-red-200' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {emp.overtime}
                    </span>
                  </td>

                  {/* Probability */}
                  <td className="py-3.5 px-4 text-center">
                    <RiskProbabilityBadge probability={emp.risk_probability} />
                  </td>

                  {/* Top Explanations (3 signals) */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1">
                      {emp.risk_reasons?.slice(0, 2).map((r, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                          <span className="font-medium text-slate-700">{r.label}:</span>
                          <span className="text-slate-500 font-mono text-[10px] bg-slate-100 px-1 rounded">{r.observed_value}</span>
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* HR Review Decision */}
                  <td className="py-3.5 px-4 text-center">
                    <ReviewStatusSelect
                      value={emp.review_status || 'pending'}
                      onChange={(newStatus) => onStatusChange?.(emp.id, newStatus)}
                    />
                  </td>

                  {/* Inspect Button */}
                  <td className="py-3.5 px-4 text-right">
                    <Link to={`/employees/${emp.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs px-2.5 font-medium text-slate-700 hover:text-emerald-700 hover:border-emerald-300"
                      >
                        Inspect
                        <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
        <span>Capacity constraint: Exact 50-record allocation for HR intervention</span>
        <span className="font-mono text-[11px]">Showing {items.length} employees</span>
      </div>
    </div>
  )
}
