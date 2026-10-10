import React from 'react'
import { Card } from '../ui/card'
import { cn } from '../../lib/utils'

export function MetricCard({ title, value, subtext, icon: Icon, badge, color = 'emerald', className }) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/60',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/60',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/60',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  }

  return (
    <Card className={cn("p-5 border-slate-200/90 shadow-2xs hover:shadow-xs transition-all", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">{value}</span>
            {badge && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {badge}
              </span>
            )}
          </div>
          {subtext && <p className="mt-1.5 text-xs text-slate-500">{subtext}</p>}
        </div>

        {Icon && (
          <div className={cn("p-2.5 rounded-xl border shrink-0", colorMap[color] || colorMap.emerald)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </Card>
  )
}
