import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Database, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react'
import { Badge } from '../ui/badge'

export function DatasetSummaryCard({ datasetSummary, _excludedColumns }) {
  if (!datasetSummary) return null

  const attritionRate = ((datasetSummary.attrition_yes / datasetSummary.row_count) * 100).toFixed(1)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              Source Dataset & Integrity
            </CardTitle>
            <CardDescription>
              IBM HR Analytics Controlled Source (35 Features, 1,470 Observations)
            </CardDescription>
          </div>
          <Badge variant="emerald" className="gap-1">
            <CheckCircle2 className="w-3 h-3" /> Validated
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Core Stat grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
            <p className="text-[11px] font-medium text-slate-500 uppercase">Records</p>
            <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">{datasetSummary.row_count.toLocaleString()}</p>
            <span className="text-[10px] text-slate-400">Total Rows</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
            <p className="text-[11px] font-medium text-slate-500 uppercase">Attrition Yes</p>
            <p className="text-xl font-bold font-mono text-red-600 mt-0.5">{datasetSummary.attrition_yes}</p>
            <span className="text-[10px] text-red-500 font-medium">{attritionRate}% Base Rate</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
            <p className="text-[11px] font-medium text-slate-500 uppercase">Retained No</p>
            <p className="text-xl font-bold font-mono text-emerald-700 mt-0.5">{datasetSummary.attrition_no}</p>
            <span className="text-[10px] text-emerald-600 font-medium">{(100 - attritionRate).toFixed(1)}% Stable</span>
          </div>
        </div>

        {/* Excluded columns compliance */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              Sanitized Predictor Exclusions
            </span>
            <span className="text-[11px] text-slate-400">5 columns dropped</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['EmployeeNumber', 'EmployeeCount', 'StandardHours', 'Over18', 'Attrition (Target)'].map((col) => (
              <span
                key={col}
                className="px-2 py-0.5 text-[11px] font-mono bg-slate-100 text-slate-600 border border-slate-200 rounded"
              >
                {col}
              </span>
            ))}
          </div>
        </div>

        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Capacity Constraint: Only the top 50 highest-risk employees are selected for intervention due to HR retention session limits.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
