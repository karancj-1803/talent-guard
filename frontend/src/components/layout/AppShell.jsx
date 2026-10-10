import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { HeaderBar } from './HeaderBar'

const PAGE_TITLES = {
  '/': 'Retention Command Dashboard',
  '/model-lab': 'Model Lab & Validation Pipeline',
  '/priorities': 'Top 50 Retention Priorities',
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Match title or dynamic route like /employees/:id
  let title = PAGE_TITLES[location.pathname]
  if (!title && location.pathname.startsWith('/employees/')) {
    title = 'Employee Retention Profile & Evidence'
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex min-h-screen sticky top-0" />

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-30 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 md:hidden transform transition-transform duration-200 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-180'}`}>
        <Sidebar onCloseMobile={() => setMobileOpen(false)} className="h-full shadow-2xl" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <HeaderBar
          onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)}
          activeTitle={title || 'Command Center'}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
