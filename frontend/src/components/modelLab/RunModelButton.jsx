import React from 'react'
import { Button } from '../ui/button'
import { Play, Loader2 } from 'lucide-react'

export function RunModelButton({ onRun, isRunning, disabled }) {
  return (
    <Button
      onClick={onRun}
      disabled={disabled || isRunning}
      isLoading={isRunning}
      size="lg"
      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-950/20 px-6 gap-2"
    >
      {isRunning ? (
        <>
          <span>Training Pipeline & Scoring 1,470 Records...</span>
        </>
      ) : (
        <>
          <Play className="w-4 h-4 fill-current" />
          <span>Execute Model Training Run</span>
        </>
      )}
    </Button>
  )
}

export function RunStatusBanner({ run, isRunning, lastError }) {
  if (isRunning) {
    return (
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-3 animate-pulse text-xs">
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
        <div>
          <p className="font-semibold text-blue-950">Executing ML Pipeline</p>
          <p className="text-[11px] text-blue-700 mt-0.5">
            Validating schema, splitting train/test (80/20 stratified), fitting LogisticRegression, computing metrics and ranking Top 50 employees...
          </p>
        </div>
      </div>
    )
  }

  if (lastError) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs">
        <p className="font-bold text-red-950">Model Run Failed</p>
        <p className="text-[11px] text-red-700 mt-0.5">{lastError}</p>
      </div>
    )
  }

  if (run) {
    return (
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <p className="font-bold text-emerald-950 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            Active Model Run: {run.id.slice(0, 8)}... (Completed)
          </p>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            50 highest attrition-risk employees identified and ranked · Generated at {new Date(run.created_at).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-800 bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-200">
          <span>ROC-AUC: <strong>{run.metrics?.roc_auc?.toFixed(3)}</strong></span>
          <span className="text-emerald-300">|</span>
          <span>P@50: <strong>{((run.metrics?.precision_at_50 || 0) * 100).toFixed(1)}%</strong></span>
        </div>
      </div>
    )
  }

  return null
}
