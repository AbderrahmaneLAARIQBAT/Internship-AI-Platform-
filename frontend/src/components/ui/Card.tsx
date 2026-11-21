import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  glass?: boolean
  hover?: boolean
  padding?: boolean
}

export const Card = ({
  children,
  className = '',
  glass = false,
  hover = false,
  padding = true,
  ...props
}: CardProps) => (
  <div
    {...props}
    className={`
      rounded-2xl border border-slate-200/60 dark:border-slate-700/60
      ${glass
        ? 'bg-white/70 dark:bg-slate-800/70 backdrop-blur-md'
        : 'bg-white dark:bg-slate-900'
      }
      ${hover ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : ''}
      ${padding ? 'p-6' : ''}
      shadow-glass dark:shadow-glass-dark
      ${className}
    `}
  >
    {children}
  </div>
)

export const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex items-center justify-between mb-4 ${className}`}>
    {children}
  </div>
)

export const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-slate-900 dark:text-white ${className}`}>
    {children}
  </h3>
)

export const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`mt-4 ${className}`}>
    {children}
  </div>
)
