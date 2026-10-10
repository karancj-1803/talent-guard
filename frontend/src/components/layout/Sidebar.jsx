import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Cpu, Users, ShieldAlert, Database } from 'lucide-react'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Model Lab', to: '/model-lab', icon: Cpu },
  { name: 'Top 50 Priorities', to: '/priorities', icon: Users },
]

export function Sidebar({ className, onCloseMobile }) {
  return (
    <aside className={cn(
      "w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-800 select-none",
      className
    )}>
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
              TalentGuard
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-medium border border-emerald-500/30">P0</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">Retention Command Center</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Command Center
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-emerald-600/90 text-white font-semibold shadow-xs"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
              )}
            >
              <Icon className="w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-105" />
              <span>{item.name}</span>
            </NavLink>
          )
        })}
      </div>

      {/* System Status Mini Widget */}
      <div className="p-4 mx-3 mb-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
        <div className="flex items-center justify-between text-slate-300 font-semibold mb-2">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Active Source
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
          IBM HR Benchmark (1,470 Records)
        </p>
        <div className="mt-2.5 pt-2.5 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
          <span>Capacity Quota</span>
          <span className="font-semibold text-emerald-400 font-mono">50 / 50 Focus</span>
        </div>
      </div>
    </aside>
  )
}
