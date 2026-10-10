import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card'
import { Button } from '../ui/button'
import { CheckCircle2, Save, Clock, FileText, AlertCircle } from 'lucide-react'
import { reviewService } from '../../services/reviewService'
import { formatDate } from '../../lib/utils'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Assessment', desc: 'Awaiting initial retention assessment' },
  { value: 'reviewed', label: 'Reviewed', desc: 'Risk signals and workload assessed by HR Manager' },
  { value: 'action_planned', label: 'Action Planned', desc: 'Retention conversation or adjustment scheduled' },
  { value: 'closed', label: 'Closed', desc: 'Intervention completed or employee situation resolved' },
]

export function ReviewForm({ employeeRiskId, initialReview, onReviewSaved }) {
  const [status, setStatus] = useState(initialReview?.status || 'pending')
  const [notes, setNotes] = useState(initialReview?.notes || '')
  const [updatedAt, setUpdatedAt] = useState(initialReview?.updated_at || null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  useEffect(() => {
    if (initialReview) {
      setStatus(initialReview.status || 'pending')
      setNotes(initialReview.notes || '')
      setUpdatedAt(initialReview.updated_at || null)
    }
  }, [initialReview])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage(null)
    setSavedSuccess(false)
    setIsSaving(true)

    try {
      const res = await reviewService.updateReview(employeeRiskId, {
        status,
        notes: notes.trim() || null
      })

      if (!res || !res.status) {
        throw new Error('Server returned an invalid review response.')
      }
      
      setUpdatedAt(res.updated_at)
      setSavedSuccess(true)
      onReviewSaved?.(res)
      
      setTimeout(() => {
        setSavedSuccess(false)
      }, 4000)
    } catch (err) {
      setSavedSuccess(false)
      setErrorMessage(err.message || 'Failed to save review decision. Please check backend connection.')
    } finally {
      setIsSaving(false)
    }
  }

  const charCount = notes.length
  const isOverLimit = charCount > 2000

  return (
    <Card className="border-slate-200/90 shadow-2xs">
      <CardHeader className="border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            HR Review & Retention Decision
          </CardTitle>
          {updatedAt && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              Saved {formatDate(updatedAt)}
            </span>
          )}
        </div>
        <CardDescription>
          Record confidential HR review outcomes and action plans. Decisions are bound to your verified HR account.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="pt-4 space-y-4">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">Review decision successfully persisted!</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Status Selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Intervention Status
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`p-3 rounded-lg border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                    status === opt.value
                      ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500/30'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="review_status"
                    value={opt.value}
                    checked={status === opt.value}
                    onChange={() => setStatus(opt.value)}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">{opt.label}</span>
                    <span className="text-[11px] text-slate-500 leading-normal block mt-0.5">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Review Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Confidential Action Notes & Follow-up Plan
              </label>
              <span className={`text-[10px] font-mono ${isOverLimit ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                {charCount} / 2,000 characters
              </span>
            </div>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Scheduled confidential 1-on-1 with employee and department lead to discuss workload distribution and career pathing..."
              className="w-full text-xs rounded-lg border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-400"
            />
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between bg-slate-50/80 rounded-b-xl border-t border-slate-100 p-4">
          <span className="text-[11px] text-slate-400">
            Changes survive browser reloads and persist to backend storage.
          </span>
          <Button
            type="submit"
            disabled={isSaving || isOverLimit}
            isLoading={isSaving}
            className="gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Decision</span>
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
