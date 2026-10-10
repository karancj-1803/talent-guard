import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ArrowRight, AlertTriangle, ChevronRight } from 'lucide-react'
import { formatProbability, getRiskLevel } from '../../lib/utils'

export function TopRiskPreview({ priorities = [], totalCount = 50 }) {
  const topRows = priorities.slice(0, 5)

  return (
    <Card>
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Immediate Retention Priorities (Top 5 Preview)
            </CardTitle>
            <CardDescription>
              Showing top 5 of {totalCount} capacity-prioritized employees ranked by predicted probability
            </CardDescription>
          </div>
          <Link to="/priorities">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              View All 50 Priorities
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department & Role</th>
                <th className="py-3 px-4 text-center">Probability</th>
                <th className="py-3 px-4">Primary Risk Signal</th>
                <th className="py-3 px-4 text-center">HR Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topRows.map((emp) => {
                const riskLevel = getRiskLevel(emp.risk_probability)
                const topReason = emp.risk_reasons?.[0]?.label || 'High workload & low satisfaction'
                
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                      #{emp.risk_rank}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {emp.employee_name || emp.employee_key}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">{emp.employee_key}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{emp.job_role}</div>
                      <div className="text-[11px] text-slate-500">{emp.department}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block font-mono font-bold text-xs px-2.5 py-1 rounded-md border ${riskLevel.bg}`}>
                        {formatProbability(emp.risk_probability)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 font-medium line-clamp-1">
                        {topReason}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={
                          emp.review_status === 'action_planned' ? 'emerald' :
                          emp.review_status === 'reviewed' ? 'blue' :
                          emp.review_status === 'closed' ? 'secondary' : 'amber'
                        }
                        className="capitalize text-[11px]"
                      >
                        {emp.review_status.replace('_', ' ')}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/employees/${emp.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-slate-600 hover:text-emerald-700">
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
      </CardContent>
    </Card>
  )
}
