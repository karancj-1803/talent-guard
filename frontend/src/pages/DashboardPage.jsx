import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MetricCard } from '../components/dashboard/MetricCard'
import { ModelPerformanceCard } from '../components/dashboard/ModelPerformanceCard'
import { DatasetSummaryCard } from '../components/dashboard/DatasetSummaryCard'
import { TopRiskPreview } from '../components/dashboard/TopRiskPreview'
import { EmptyRunState } from '../components/dashboard/EmptyRunState'
import { Button } from '../components/ui/button'
import { runService } from '../services/runService'
import { priorityService } from '../services/priorityService'
import { Users, Award, Target, CheckSquare, ArrowRight, RefreshCw } from 'lucide-react'

export function DashboardPage() {
  const [latestRun, setLatestRun] = useState(null)
  const [priorities, setPriorities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [reviewedCount, setReviewedCount] = useState(0)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const runsRes = await runService.listRuns()
      if (runsRes.items && runsRes.items.length > 0) {
        const fullRun = await runService.getRun(runsRes.items[0].id)
        setLatestRun(fullRun)

        const prioRes = await priorityService.getPriorities(fullRun.id, { limit: 50 })
        setPriorities(prioRes.items || [])

        // Count reviewed
        const count = (prioRes.items || []).filter(e => e.review_status && e.review_status !== 'pending').length
        setReviewedCount(count)
      } else {
        setLatestRun(null)
        setPriorities([])
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200/60 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200/60 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200/60 rounded-xl" />
          <div className="h-64 bg-slate-200/60 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!latestRun) {
    return <EmptyRunState />
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome / Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              TechNova Retention Command Center
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Production Cycle Active · Scored against IBM HR Benchmark dataset (1,470 employees)
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="text-xs h-9 gap-1.5"
            title="Refresh Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Link to="/priorities">
            <Button size="sm" className="text-xs h-9 gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
              <span>Inspect Priorities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Capacity Intervention Cohort"
          value="50 / 50"
          subtext="Target retention capacity constraint"
          badge="100% Filled"
          icon={Target}
          color="emerald"
        />

        <MetricCard
          title="Model Discrimination (ROC-AUC)"
          value={latestRun.metrics?.roc_auc != null ? latestRun.metrics.roc_auc.toFixed(3) : 'N/A'}
          subtext="Stratified held-out test split"
          badge="Balanced"
          icon={Award}
          color="blue"
        />

        <MetricCard
          title="Capacity Accuracy (P@50)"
          value={latestRun.metrics?.precision_at_50 != null ? `${(latestRun.metrics.precision_at_50 * 100).toFixed(1)}%` : 'N/A'}
          subtext="Precision within top-50 cohort"
          badge="Held-out"
          icon={Users}
          color="amber"
        />

        <MetricCard
          title="HR Review Progress"
          value={`${reviewedCount} / 50`}
          subtext={`${50 - reviewedCount} decisions pending review`}
          badge={reviewedCount > 0 ? `${reviewedCount} Processed` : 'Action Required'}
          icon={CheckSquare}
          color="purple"
        />
      </div>

      {/* Middle Row: Model Performance & Dataset Integrity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModelPerformanceCard metrics={latestRun.metrics} />
        <DatasetSummaryCard
          datasetSummary={latestRun.dataset_summary}
          excludedColumns={latestRun.excluded_columns}
        />
      </div>

      {/* Bottom Row: Top 5 Priorities Preview */}
      <TopRiskPreview priorities={priorities} totalCount={50} />
    </div>
  )
}
