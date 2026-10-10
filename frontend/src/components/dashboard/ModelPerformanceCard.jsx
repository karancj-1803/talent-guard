import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Award, Info } from 'lucide-react'
import { formatPercent } from '../../lib/utils'

export function ModelPerformanceCard({ metrics }) {
  if (!metrics) return null

  const items = [
    {
      label: 'ROC-AUC',
      val: metrics.roc_auc ? metrics.roc_auc.toFixed(3) : 'N/A',
      desc: 'Discrimination across probability thresholds',
      color: 'emerald',
      progress: metrics.roc_auc ? metrics.roc_auc * 100 : 0
    },
    {
      label: 'Average Precision (PR-AUC)',
      val: metrics.average_precision ? metrics.average_precision.toFixed(3) : 'N/A',
      desc: 'Precision across recall curve on imbalanced class',
      color: 'blue',
      progress: metrics.average_precision ? metrics.average_precision * 100 : 0
    },
    {
      label: 'Precision @ 50 (Held-out)',
      val: formatPercent(metrics.precision_at_50),
      desc: 'Accuracy within top-ranked capacity cohort',
      color: 'amber',
      progress: metrics.precision_at_50 ? metrics.precision_at_50 * 100 : 0
    },
    {
      label: 'Recall @ 50 (Held-out)',
      val: formatPercent(metrics.recall_at_50),
      desc: 'Total historical attritions captured in Top 50',
      color: 'purple',
      progress: metrics.recall_at_50 ? metrics.recall_at_50 * 100 : 0
    }
  ]

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              Model Performance Benchmarks
            </CardTitle>
            <CardDescription>
              Stratified held-out test split (20% sample, 294 rows) · Logistic Regression (Balanced)
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((m) => (
            <div key={m.label} className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">{m.label}</span>
                  <span className="font-mono text-base font-bold text-slate-900">{m.val}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">{m.desc}</p>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, m.progress))}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-xs text-slate-600 flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-slate-700">Reproducibility Guarantee:</span> Trained with <code className="bg-white px-1 py-0.5 border border-slate-200 rounded text-slate-800">random_state={metrics.random_state || 42}</code> and standard scaling fitted strictly on training fold to guarantee zero data leakage.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
