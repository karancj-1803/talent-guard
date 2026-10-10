import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return "N/A"
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatProbability(value) {
  if (value === null || value === undefined) return "N/A"
  return `${(value * 100).toFixed(1)}%`
}

export function getRiskLevel(probability) {
  if (probability >= 0.65) return { label: "High Risk", color: "red", bg: "bg-red-50 text-red-700 border-red-200" }
  if (probability >= 0.40) return { label: "Moderate Risk", color: "amber", bg: "bg-amber-50 text-amber-700 border-amber-200" }
  return { label: "Lower Risk", color: "emerald", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" }
}

export function formatDate(isoString) {
  if (!isoString) return "N/A"
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  } catch {
    return isoString
  }
}
