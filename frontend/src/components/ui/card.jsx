import React from 'react'
import { cn } from '../../lib/utils'

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/90 bg-white text-slate-900 shadow-xs transition-shadow hover:shadow-sm",
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-5 pb-3", className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn("text-base font-semibold leading-none tracking-tight text-slate-900", className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn("text-xs text-slate-500 font-normal mt-1", className)}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-5 pt-2", className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn("flex items-center p-5 pt-0 border-t border-slate-100 mt-4", className)}
      {...props}
    />
  )
}
