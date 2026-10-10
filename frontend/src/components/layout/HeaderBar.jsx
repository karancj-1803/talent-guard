import React from 'react'
import { Menu, LogOut, Activity } from 'lucide-react'
import { useAuth } from '../../app/AuthProvider'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

export function HeaderBar({ onToggleMobileSidebar, activeTitle = 'Command Center' }) {
  const { user, signOut } = useAuth()

  return (
    <header className="h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {activeTitle}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* Model Pipeline Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium">
          <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>Model Engine: Ready</span>
        </div>

        {/* User Pill & Sign Out */}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold">
                {user.display_name ? user.display_name.charAt(0) : 'U'}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <p className="font-semibold text-slate-800 leading-tight">{user.display_name || user.email}</p>
                <p className="text-[10px] text-slate-500 capitalize">{user.role?.replace('_', ' ') || 'HR Manager'}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              title="Sign Out"
              className="text-slate-500 hover:text-red-600 hover:bg-red-50 h-8 px-2.5"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline text-xs">Sign Out</span>
            </Button>
          </div>
        ) : (
          <Badge variant="secondary">Guest Mode</Badge>
        )}
      </div>
    </header>
  )
}
