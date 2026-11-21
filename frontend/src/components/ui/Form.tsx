import React from 'react'

// ── Skeleton ──────────────────────────────────────────────────────────────────
export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded-lg ${className}`}
    style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite linear' }}
  />
)

export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
    ))}
  </div>
)

export const SkeletonCard = () => (
  <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-6 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <SkeletonText lines={2} />
    <div className="flex gap-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  </div>
)

// ── Progress Bar ──────────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number
  max?: number
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
  className?: string
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-emerald-500 to-emerald-600',
  orange: 'from-orange-500 to-orange-600',
  red: 'from-red-500 to-red-600',
  purple: 'from-violet-500 to-violet-600',
}

const sizeClasses = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }

export const ProgressBar = ({
  value,
  max = 100,
  color = 'blue',
  size = 'md',
  showLabel = false,
  animated = true,
  className = '',
}: ProgressBarProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const barColor = value >= 80 ? 'green' : value >= 60 ? 'blue' : value >= 40 ? 'orange' : 'red'
  const activeColor = colorClasses[color === 'blue' ? barColor : color]

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} bg-gradient-to-r ${activeColor} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-500 mt-1 font-medium">{Math.round(percentage)}%</span>
      )}
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-xl border bg-white dark:bg-slate-800
            text-slate-900 dark:text-white
            placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-all duration-200
            ${
              error
                ? 'border-red-400 focus:ring-red-400'
                : 'border-slate-200 dark:border-slate-600'
            }
            ${icon ? 'pl-10 pr-4' : 'px-4'} py-2.5 text-sm
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'

// ── Select ─────────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full rounded-xl border bg-white dark:bg-slate-800
          text-slate-900 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          transition-all duration-200 px-4 py-2.5 text-sm
          ${error ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'}
          ${className}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'
