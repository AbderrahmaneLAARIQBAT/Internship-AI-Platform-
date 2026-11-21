import React from 'react'
import type { CandidateStatus, ApplicationStatus } from '@/types'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export const Badge = ({ children, variant = 'neutral', className = '' }: BadgeProps) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
    {children}
  </span>
)

// Status badge maps
export const candidateStatusVariant: Record<CandidateStatus, BadgeVariant> = {
  pending: 'neutral',
  under_review: 'info',
  shortlisted: 'warning',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
}

export const applicationStatusVariant: Record<ApplicationStatus, BadgeVariant> = {
  pending: 'neutral',
  under_review: 'info',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
}

export const StatusBadge = ({ status }: { status: CandidateStatus | ApplicationStatus }) => {
  const variant =
    (candidateStatusVariant[status as CandidateStatus] ||
    applicationStatusVariant[status as ApplicationStatus] ||
    'neutral') as BadgeVariant

  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return <Badge variant={variant}>{label}</Badge>
}
