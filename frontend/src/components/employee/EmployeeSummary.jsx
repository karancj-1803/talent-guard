import { Card, CardContent } from '../ui/card'
import { RiskRank, RiskProbabilityBadge } from '../priorities/RiskProbabilityBadge'
import { User, Briefcase, Building } from 'lucide-react'

export function EmployeeSummary({ employee }) {
  if (!employee) return null

  const attrs = employee.employee_attributes || {}

  return (
    <Card className="overflow-hidden border-slate-200 shadow-xs">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {employee.employee_name || employee.employee_key}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/15 text-slate-200 border border-white/10">
                  {employee.employee_key}
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-1 flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                <span>{employee.job_role}</span>
                <span className="text-slate-500">•</span>
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{employee.department}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/15 self-start sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">Attrition Risk</span>
              <div className="mt-0.5">
                <RiskProbabilityBadge probability={employee.risk_probability} />
              </div>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">Cohort Rank</span>
              <div className="mt-0.5">
                <RiskRank rank={employee.risk_rank} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attributes Grid */}
      <CardContent className="p-6 bg-white">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Observed Workforce Attributes
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 block">Overtime</span>
            <span className={`font-mono text-sm font-bold mt-1 inline-block ${attrs.overtime === 'Yes' ? 'text-red-600' : 'text-slate-700'}`}>
              {attrs.overtime || 'No'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 block">Job Satisfaction</span>
            <span className="font-mono text-sm font-bold text-slate-800 mt-1 inline-block">
              {attrs.job_satisfaction ? `${attrs.job_satisfaction} / 4` : 'N/A'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 block">Company Tenure</span>
            <span className="font-mono text-sm font-bold text-slate-800 mt-1 inline-block">
              {attrs.years_at_company ? `${attrs.years_at_company} Yrs` : 'N/A'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 block">Monthly Income</span>
            <span className="font-mono text-sm font-bold text-slate-800 mt-1 inline-block">
              {attrs.monthly_income ? `$${attrs.monthly_income.toLocaleString()}` : 'N/A'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 block">Work-Life Balance</span>
            <span className="font-mono text-sm font-bold text-slate-800 mt-1 inline-block">
              {attrs.work_life_balance ? `${attrs.work_life_balance} / 4` : 'N/A'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 block">Total Career Yrs</span>
            <span className="font-mono text-sm font-bold text-slate-800 mt-1 inline-block">
              {attrs.total_working_years ? `${attrs.total_working_years} Yrs` : 'N/A'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
