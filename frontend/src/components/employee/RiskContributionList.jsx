import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { TrendingUp, Info } from 'lucide-react'

export function RiskContributionList({ reasons = [] }) {
  return (
    <Card className="h-full">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              Primary Model Risk Signals (Evidence)
            </CardTitle>
            <CardDescription>
              Top 3 explainable feature contributions derived from logistic regression coefficients
            </CardDescription>
          </div>
          <span className="text-[11px] font-mono font-semibold bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200">
            3 Factors Identified
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {reasons.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No specific risk signals generated for this record.</p>
        ) : (
          reasons.map((r, idx) => {
            const contributionVal = typeof r.contribution === 'number' ? r.contribution : 0.25

            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 transition-all hover:border-slate-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{r.label}</h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        Feature: {r.feature}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      Observed: <strong className="text-slate-900">{r.observed_value}</strong>
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                      +{contributionVal.toFixed(2)} Impact
                    </span>
                  </div>
                </div>

                {/* Progress impact gauge */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span>Contribution Magnitude</span>
                    <span className="font-semibold text-red-600">Increases Attrition Probability</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(15, contributionVal * 200))}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })
        )}

        <div className="p-3 rounded-lg bg-slate-100/80 border border-slate-200 text-slate-600 text-[11px] flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>
            Feature contributions reflect the individual's normalized log-odds shift against baseline company distributions.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
