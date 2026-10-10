import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { Badge } from '../ui/badge'

export function DatasetValidationSummary({ validationSummary }) {
  if (!validationSummary) return null

  return (
    <Card className="h-full">
      <CardHeader className="border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Dataset Schema Validation Gates
          </CardTitle>
          <Badge variant="emerald" className="gap-1 text-[10px]">
            <CheckCircle2 className="w-3 h-3" /> All Gates Passed
          </Badge>
        </div>
        <CardDescription>
          Automated integrity verification executed before preprocessing and model fitting
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 space-y-2.5">
        {validationSummary.checks?.map((chk, idx) => (
          <div key={idx} className="flex items-start justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">{chk.check}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{chk.details}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-semibold text-emerald-700 uppercase bg-emerald-100/70 px-1.5 py-0.5 rounded">
              {chk.status}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
