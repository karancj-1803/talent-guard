import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react'
import { Badge } from '../ui/badge'

export function RecommendationCard({ recommendations = [], rank }) {
  const isTop10 = rank <= 10

  if (!isTop10 || recommendations.length === 0) {
    return (
      <Card className="h-full bg-slate-50/50 border-dashed border-slate-300">
        <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
          <Lightbulb className="w-8 h-8 text-slate-300 mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">Top-10 Cohort Only</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
            Rule-based retention action recommendations are targeted specifically to the Top-10 prioritized employees (Ranks #1 through #10) to optimize HR retention bandwidth.
          </p>
          <span className="text-[11px] font-mono text-slate-400 mt-3 bg-white px-2 py-0.5 rounded border border-slate-200">
            Current Rank: #{rank} (Outside Top 10)
          </span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full border-emerald-200/80 shadow-xs">
      <CardHeader className="border-b border-slate-100 pb-4 bg-emerald-50/40">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-emerald-950">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Prescriptive Retention Playbook (Top 10)
            </CardTitle>
            <CardDescription className="text-emerald-800/80">
              Deterministic rule-based recommendations generated from identified risk drivers
            </CardDescription>
          </div>
          <Badge variant="emerald" className="text-[10px]">3 Action Plans</Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {recommendations.map((rec, idx) => (
          <div
            key={rec.code || idx}
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <h4 className="text-sm font-bold text-slate-900">{rec.title}</h4>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">
                {rec.code}
              </span>
            </div>

            <p className="text-xs text-slate-600 ml-7 leading-relaxed">
              <strong className="text-slate-700">Driver Context:</strong> {rec.reason}
            </p>

            <div className="mt-3 ml-7 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/60 text-xs text-emerald-900 flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[11px] uppercase tracking-wider text-emerald-800 block">
                  Recommended Action
                </span>
                <p className="text-[11px] text-emerald-950 mt-0.5 font-medium leading-relaxed">
                  {rec.suggested_action}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
