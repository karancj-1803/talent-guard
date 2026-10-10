import React, { useState, useEffect } from 'react'
import { DatasetStatusCard } from '../components/modelLab/DatasetStatusCard'
import { DatasetValidationSummary } from '../components/modelLab/DatasetValidationSummary'
import { FeatureExclusionList } from '../components/modelLab/FeatureExclusionList'
import { RunModelButton, RunStatusBanner } from '../components/modelLab/RunModelButton'
import { ModelPerformanceCard } from '../components/dashboard/ModelPerformanceCard'
import { runService } from '../services/runService'
import { Cpu } from 'lucide-react'

export function ModelLabPage() {
  const [currentRun, setCurrentRun] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [lastError, setLastError] = useState(null)

  const loadLatestRun = async () => {
    try {
      const runs = await runService.listRuns()
      if (runs.items && runs.items.length > 0) {
        const full = await runService.getRun(runs.items[0].id)
        setCurrentRun(full)
      }
    } catch (err) {
      console.error('Failed to load run:', err)
    } finally {
      setIsLoadingInitial(false)
    }
  }

  useEffect(() => {
    loadLatestRun()
  }, [])

  const handleExecuteRun = async () => {
    setLastError(null)
    setIsRunning(true)
    try {
      const newRun = await runService.createRun({
        dataset_source: "bundled_ibm_hr",
        test_size: 0.2,
        random_state: 42
      })
      setCurrentRun(newRun)
    } catch (err) {
      setLastError(err.message || 'Model training failed')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Model Lab & Machine Learning Pipeline
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reproducible Scikit-Learn Logistic Regression Baseline · Stratified 80/20 Validation
          </p>
        </div>

        <div className="self-start sm:self-auto">
          <RunModelButton
            onRun={handleExecuteRun}
            isRunning={isRunning}
            disabled={isLoadingInitial}
          />
        </div>
      </div>

      {/* Run status banner */}
      <RunStatusBanner
        run={currentRun}
        isRunning={isRunning}
        lastError={lastError}
      />

      {/* Grid: Dataset status & validation gates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DatasetStatusCard
          datasetSummary={currentRun?.dataset_summary}
        />
        <DatasetValidationSummary
          validationSummary={currentRun?.validation_summary}
        />
      </div>

      {/* Model Performance & Exclusions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModelPerformanceCard
          metrics={currentRun?.metrics}
        />
        <FeatureExclusionList
          excludedColumns={currentRun?.excluded_columns}
        />
      </div>
    </div>
  )
}
