import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Database } from 'lucide-react'
import { Badge } from '../ui/badge'

export function DatasetStatusCard({ datasetSummary }) {
  if (!datasetSummary) return null

  return (
    <Card className="h-full">
      <CardHeader className="border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            Configured Dataset Source
          </CardTitle>
          <Badge variant="emerald" className="text-[10px]">Trusted Source</Badge>
        </div>
        <CardDescription>
          Backend controlled dataset path: <code className="text-slate-800 font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">data/WA_Fn-UseC_-HR-Employee-Attrition.csv</code>
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 text-[11px]">Row Count</span>
            <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">{datasetSummary.row_count.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 text-[11px]">Raw Columns</span>
            <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">{datasetSummary.column_count}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 text-[11px]">Positive Class (Yes)</span>
            <p className="text-lg font-bold font-mono text-red-600 mt-0.5">{datasetSummary.attrition_yes} ({((datasetSummary.attrition_yes / datasetSummary.row_count) * 100).toFixed(1)}%)</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 text-[11px]">Negative Class (No)</span>
            <p className="text-lg font-bold font-mono text-emerald-700 mt-0.5">{datasetSummary.attrition_no}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
