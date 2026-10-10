import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Database, ShieldAlert } from 'lucide-react'

export function EmptyRunState() {
  return (
    <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50 p-8 text-center">
      <CardContent className="max-w-md mx-auto flex flex-col items-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4">
          <Database className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Prepared Model Ranking Available</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          The pre-trained retention ranking and production model artifact are pending or not yet loaded by the backend. Once offline preparation completes, the Top-50 cohort will appear automatically.
        </p>
        <div className="mt-4 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
          <span>Status: Offline Preparation Required</span>
        </div>
      </CardContent>
    </Card>
  )
}
