import React, { useEffect, useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { SkeletonCard } from '@/components/ui/Form'
import { StatusBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/Form'
import {
  UsersIcon, DepartmentIcon, ApplicationIcon, AnalyticsIcon,
  AIIcon, BrainIcon, TrendUpIcon,
} from '@/assets/svg/Icons'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { analyticsApi, candidatesApi } from '@/services/api'
import type { DashboardStats, CandidatesByStatus, TopSkill, DepartmentCapacity, Candidate } from '@/types'

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statusData, setStatusData] = useState<CandidatesByStatus[]>([])
  const [topSkills, setTopSkills] = useState<TopSkill[]>([])
  const [deptCapacity, setDeptCapacity] = useState<DepartmentCapacity[]>([])
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, statusRes, skillsRes, deptRes, candidatesRes] = await Promise.all([
          analyticsApi.dashboard(),
          analyticsApi.candidatesByStatus(),
          analyticsApi.topSkills(8),
          analyticsApi.departmentsCapacity(),
          candidatesApi.list({ page: 1, size: 5 }),
        ])
        setStats(statsRes.data)
        setStatusData(statusRes.data)
        setTopSkills(skillsRes.data)
        setDeptCapacity(deptRes.data)
        setRecentCandidates(candidatesRes.data.items)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  return (
    <Layout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : stats ? (
          <>
            <StatsCard
              title="Total Candidates"
              value={stats.total_candidates}
              icon={<UsersIcon className="h-6 w-6" />}
              color="blue"
              trend={12}
            />
            <StatsCard
              title="Applications"
              value={stats.total_applications}
              subtitle={`${stats.pending_applications} pending`}
              icon={<ApplicationIcon className="h-6 w-6" />}
              color="orange"
            />
            <StatsCard
              title="Departments"
              value={stats.total_departments}
              icon={<DepartmentIcon className="h-6 w-6" />}
              color="purple"
            />
            <StatsCard
              title="Avg AI Score"
              value={`${stats.avg_ai_score}%`}
              subtitle={`${stats.shortlisted_candidates} shortlisted`}
              icon={<BrainIcon className="h-6 w-6" />}
              color="green"
              trend={5}
            />
          </>
        ) : null}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Skills Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Skills</CardTitle>
            <span className="text-xs text-slate-400">By candidate count</span>
          </CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topSkills} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="skill_name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="candidate_count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Candidates" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Candidates by Status</CardTitle>
            <span className="text-xs text-slate-400">Distribution</span>
          </CardHeader>
          <div className="flex items-center">
            <ResponsiveContainer width="60%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {statusData.map((item, i) => (
                <div key={item.status} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-slate-600 dark:text-slate-400 capitalize">
                    {item.status.replace(/_/g, ' ')}
                  </span>
                  <span className="ml-auto font-semibold text-slate-800 dark:text-white">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Department Capacity + Recent Candidates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Capacity */}
        <Card>
          <CardHeader>
            <CardTitle>Department Capacity</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {deptCapacity.map((dept) => (
              <div key={dept.department_name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[70%]">
                    {dept.department_name}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs">
                    {dept.current_count}/{dept.capacity}
                  </span>
                </div>
                <ProgressBar value={dept.fill_percentage} showLabel={false} size="md" />
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Candidates */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Candidates</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {recentCandidates.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/30 dark:to-violet-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm flex-shrink-0">
                  {c.first_name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {c.first_name} {c.last_name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{c.university || 'N/A'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="text-right flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 capitalize">
                      {c.workflow_stage.replace(/_/g, ' ')}
                    </span>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{c.ai_score}%</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
