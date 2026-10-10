import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { priorityService } from '../services/priorityService'
import { EmployeeSummary } from '../components/employee/EmployeeSummary'
import { RiskContributionList } from '../components/employee/RiskContributionList'
import { RecommendationCard } from '../components/employee/RecommendationCard'
import { ReviewForm } from '../components/employee/ReviewForm'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { ArrowLeft, UserX } from 'lucide-react'

export function EmployeeDetailPage() {
  const { employeeRiskId } = useParams()

  const [employee, setEmployee] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadEmployee() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await priorityService.getEmployeeDetail(null, employeeRiskId)
        setEmployee(data)
      } catch (err) {
        setError(err.message || 'Employee record could not be loaded.')
      } finally {
        setIsLoading(false)
      }
    }
    loadEmployee()
  }, [employeeRiskId])

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center max-w-lg mx-auto mt-8">
        <UserX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Employee Record Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          {error || `No prioritization record exists for identifier ${employeeRiskId}.`}
        </p>
        <Link to="/priorities">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Priorities Table
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link to="/priorities">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Priorities Ranking</span>
          </Button>
        </Link>
      </div>

      {/* Hero Summary Card */}
      <EmployeeSummary employee={employee} />

      {/* Evidence & Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3 Model Explanations */}
        <RiskContributionList reasons={employee.risk_reasons} />

        {/* 3 Top 10 Recommendations */}
        <RecommendationCard
          recommendations={employee.recommendations}
          rank={employee.risk_rank}
        />
      </div>

      {/* HR Review Decision Form */}
      <ReviewForm
        employeeRiskId={employee.id}
        initialReview={employee.review}
        onReviewSaved={(updated) => {
          setEmployee(prev => ({
            ...prev,
            review_status: updated.status,
            review: updated
          }))
        }}
      />
    </div>
  )
}
