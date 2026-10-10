import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mx-auto mb-4">
          <FileQuestion className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">404 — Page Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          The requested route or resource does not exist in TalentGuard Retention Command Center.
        </p>
        <div className="mt-6">
          <Link to="/">
            <Button className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
