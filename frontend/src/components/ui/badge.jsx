import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-900 text-white",
        secondary: "border-slate-200 bg-slate-100 text-slate-800",
        outline: "border-slate-300 text-slate-700 bg-white",
        emerald: "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold",
        amber: "border-amber-200 bg-amber-50 text-amber-800 font-semibold",
        red: "border-red-200 bg-red-50 text-red-800 font-semibold",
        blue: "border-blue-200 bg-blue-50 text-blue-800 font-semibold",
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

export function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
