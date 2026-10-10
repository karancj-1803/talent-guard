import React from 'react'
import { getRiskLevel, formatProbability } from '../../lib/utils'

export function RiskProbabilityBadge({ probability }) {
  const level = getRiskLevel(probability)
  return (
    <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2.5 py-1 rounded-md border ${level.bg}`}>
      {formatProbability(probability)}
    </span>
  )
}

export function RiskRank({ rank }) {
  const isTop10 = rank <= 10
  return (
    <div className="flex items-center gap-1 justify-center">
      <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
        isTop10 
          ? 'bg-red-100 text-red-900 border border-red-200 font-extrabold' 
          : 'bg-slate-100 text-slate-700'
      }`}>
        #{rank}
      </span>
      {isTop10 && (
        <span className="text-[9px] bg-red-600 text-white font-bold px-1 rounded uppercase tracking-tighter" title="Top-10 Intervention Cohort">
          T10
        </span>
      )}
    </div>
  )
}
