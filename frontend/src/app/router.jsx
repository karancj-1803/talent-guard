import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { ModelLabPage } from '../pages/ModelLabPage'
import { PrioritiesPage } from '../pages/PrioritiesPage'
import { EmployeeDetailPage } from '../pages/EmployeeDetailPage'
import { NotFoundPage } from '../pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute><AppShell /></ProtectedRoute>,
    children: [
      {
        path: '/',
        element: <DashboardPage />,
      },
      {
        path: '/model-lab',
        element: <ModelLabPage />,
      },
      {
        path: '/priorities',
        element: <PrioritiesPage />,
      },
      {
        path: '/employees/:employeeRiskId',
        element: <EmployeeDetailPage />,
      },
    ],
  },
  {
    path: '/not-found',
    element: <NotFoundPage />,
  },
  {
    path: '*',
    element: <Navigate to="/not-found" replace />,
  },
])
