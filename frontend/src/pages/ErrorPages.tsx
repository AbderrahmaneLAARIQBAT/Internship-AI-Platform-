import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export const Error404Page = () => {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 text-center">
      <h1 className="text-6xl font-black text-slate-200 dark:text-slate-800 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Page Not Found</h2>
      <p className="text-slate-500 mb-8 max-w-sm">The page you are looking for doesn't exist or has been moved.</p>
      <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
    </div>
  )
}

export const Error403Page = () => {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 text-center">
      <h1 className="text-6xl font-black text-slate-200 dark:text-slate-800 mb-4">403</h1>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Access Denied</h2>
      <p className="text-slate-500 mb-8 max-w-sm">You don't have permission to view this page.</p>
      <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
    </div>
  )
}

export const Error500Page = () => {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 text-center">
      <h1 className="text-6xl font-black text-slate-200 dark:text-slate-800 mb-4">500</h1>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Server Error</h2>
      <p className="text-slate-500 mb-8 max-w-sm">Something went wrong on our end. Please try again later.</p>
      <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
    </div>
  )
}
