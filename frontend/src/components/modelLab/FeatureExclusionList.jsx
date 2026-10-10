import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { FilterX } from 'lucide-react'
import { MOCK_EXCLUDED_COLUMNS } from '../../data/mockData'

export function FeatureExclusionList({ _excludedColumns = [] }) {
  const exclusions = MOCK_EXCLUDED_COLUMNS

  return (
    <Card>
      <CardHeader className="border-b border-slate-100 pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <FilterX className="w-4 h-4 text-slate-700" />
          Feature Exclusion & Data Leakage Protection
        </CardTitle>
        <CardDescription>
          Explicitly removed predictors to prevent non-generalizable artifacts or label leakage
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="space-y-2">
          {exclusions.map((item) => (
            <div key={item.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs gap-1.5">
              <span className="font-mono font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 self-start sm:self-auto">
                {item.name}
              </span>
              <span className="text-slate-500 text-[11px] sm:text-right">
                {item.reason}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
