import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { SkeletonCard } from '@/components/ui/Form'

// Lazy-loaded pages
const LandingPage = lazy(() => import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })))
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const CandidatesPage = lazy(() => import('@/pages/CandidatesPage').then((m) => ({ default: m.CandidatesPage })))
const CandidateDetailsPage = lazy(() => import('@/pages/CandidateDetailsPage').then((m) => ({ default: m.CandidateDetailsPage })))
const CandidateFormPage = lazy(() => import('@/pages/CandidateFormPage').then((m) => ({ default: m.CandidateFormPage })))
const DepartmentsPage = lazy(() => import('@/pages/DepartmentsPage').then((m) => ({ default: m.DepartmentsPage })))
const DepartmentDetailsPage = lazy(() => import('@/pages/DepartmentDetailsPage').then((m) => ({ default: m.DepartmentDetailsPage })))
const DepartmentCandidateMatchPage = lazy(() => import('@/pages/DepartmentCandidateMatchPage').then((m) => ({ default: m.DepartmentCandidateMatchPage })))
const ApplicationsPage = lazy(() => import('@/pages/ApplicationsPage').then((m) => ({ default: m.ApplicationsPage })))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const AssistantPage = lazy(() => import('@/pages/AssistantPage').then((m) => ({ default: m.AssistantPage })))
const UsersPage = lazy(() => import('@/pages/UsersPage').then((m) => ({ default: m.UsersPage })))
const ImportPage = lazy(() => import('@/pages/ImportPage').then((m) => ({ default: m.ImportPage })))
const AuditLogPage = lazy(() => import('@/pages/AuditLogPage').then((m) => ({ default: m.AuditLogPage })))
const Error404Page = lazy(() => import('@/pages/ErrorPages').then((m) => ({ default: m.Error404Page })))
const Error403Page = lazy(() => import('@/pages/ErrorPages').then((m) => ({ default: m.Error403Page })))
const Error500Page = lazy(() => import('@/pages/ErrorPages').then((m) => ({ default: m.Error500Page })))

const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-4">
    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
  </div>
)

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export const AppRouter = () => (
  <Suspense fallback={<LoadingFallback />}>
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Protected */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/candidates" element={<ProtectedRoute><CandidatesPage /></ProtectedRoute>} />
      <Route path="/candidates/new" element={<ProtectedRoute><CandidateFormPage /></ProtectedRoute>} />
      <Route path="/candidates/:id" element={<ProtectedRoute><CandidateDetailsPage /></ProtectedRoute>} />
      <Route path="/candidates/:id/edit" element={<ProtectedRoute><CandidateFormPage /></ProtectedRoute>} />
      <Route path="/departments" element={<ProtectedRoute><DepartmentsPage /></ProtectedRoute>} />
      <Route path="/departments/:id" element={<ProtectedRoute><DepartmentDetailsPage /></ProtectedRoute>} />
      <Route path="/departments/:deptId/candidates/:candidateId" element={<ProtectedRoute><DepartmentCandidateMatchPage /></ProtectedRoute>} />
      <Route path="/applications" element={<ProtectedRoute><ApplicationsPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/assistant" element={<ProtectedRoute><AssistantPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      <Route path="/import" element={<ProtectedRoute><ImportPage /></ProtectedRoute>} />
      <Route path="/audit-log" element={<ProtectedRoute><AuditLogPage /></ProtectedRoute>} />

      {/* Error Pages */}
      <Route path="/403" element={<Error403Page />} />
      <Route path="/500" element={<Error500Page />} />
      <Route path="*" element={<Error404Page />} />
    </Routes>
  </Suspense>
)
