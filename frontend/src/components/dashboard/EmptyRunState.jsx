import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Cpu, ArrowRight } from 'lucide-react'

export function EmptyRunState() {
  return (
    <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50 p-8 text-center">
      <CardContent className="max-w-md mx-auto flex flex-col items-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4">
          <Cpu className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Model Run Generated Yet</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          To prioritize the Top 50 employees at risk of attrition, run the Logistic Regression pipeline in the Model Lab.
        </p>
        <div className="mt-5">
          <Link to="/model-lab">
            <Button className="gap-2">
              Open Model Lab
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
