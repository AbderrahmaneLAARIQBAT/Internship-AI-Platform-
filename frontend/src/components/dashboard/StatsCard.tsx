import React from 'react'
import { Card } from '@/components/ui/Card'
import { TrendUpIcon } from '@/assets/svg/Icons'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'rose'
  trend?: number
}

const colorMap = {
  blue: {
    bg: 'from-blue-500 to-blue-600',
    icon: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    text: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'from-emerald-500 to-emerald-600',
    icon: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  orange: {
    bg: 'from-orange-500 to-orange-600',
    icon: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    text: 'text-orange-600 dark:text-orange-400',
  },
  purple: {
    bg: 'from-violet-500 to-violet-600',
    icon: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
    text: 'text-violet-600 dark:text-violet-400',
  },
  rose: {
    bg: 'from-rose-500 to-rose-600',
    icon: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
    text: 'text-rose-600 dark:text-rose-400',
  },
}

export const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  trend,
}: StatsCardProps) => {
  const c = colorMap[color]
  return (
    <Card hover className="relative overflow-hidden">
      {/* Background accent */}
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[60px] bg-gradient-to-br ${c.bg} opacity-5`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              <TrendUpIcon className={`h-3.5 w-3.5 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend)}% this month
            </div>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${c.icon}`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}
