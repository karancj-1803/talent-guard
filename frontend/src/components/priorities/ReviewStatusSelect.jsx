import React from 'react'

const STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'action_planned', label: 'Action Planned', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'closed', label: 'Closed', color: 'bg-slate-100 text-slate-700 border-slate-300' },
]

export function ReviewStatusSelect({ value, onChange, disabled, _size = 'sm' }) {
  const current = STATUSES.find(s => s.value === value) || STATUSES[0]

  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`font-semibold rounded-md border text-xs py-1 px-2.5 transition-colors focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer ${current.color}`}
    >
      {STATUSES.map(s => (
        <option key={s.value} value={s.value} className="bg-white text-slate-800">
          {s.label}
        </option>
      ))}
    </select>
  )
}
