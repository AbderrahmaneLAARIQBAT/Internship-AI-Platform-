import React, { useEffect, useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { SkeletonCard } from '@/components/ui/Form'
import { AnalyticsIcon, UsersIcon, BrainIcon } from '@/assets/svg/Icons'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { analyticsApi } from '@/services/api'
import type { CandidatesByStatus, TopSkill, DepartmentCapacity, ActivityTrend } from '@/types'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export const AnalyticsPage = () => {
  const [statusData, setStatusData] = useState<CandidatesByStatus[]>([])
  const [topSkills, setTopSkills] = useState<TopSkill[]>([])
  const [deptCapacity, setDeptCapacity] = useState<DepartmentCapacity[]>([])
  const [trendData, setTrendData] = useState<ActivityTrend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsApi.candidatesByStatus(),
      analyticsApi.topSkills(10),
      analyticsApi.departmentsCapacity(),
      analyticsApi.activityTrend(),
    ])
      .then(([s, sk, d, t]) => {
        setStatusData(s.data)
        setTopSkills(sk.data)
        setDeptCapacity(d.data)
        setTrendData(t.data)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout title="Analytics">
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Activity Trend</CardTitle>
              <span className="text-xs text-slate-400">Last 7 months</span>
            </CardHeader>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorCandidates" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="candidates" stroke="#3b82f6" strokeWidth={2} fill="url(#colorCandidates)" name="Candidates" />
                <Area type="monotone" dataKey="applications" stroke="#10b981" strokeWidth={2} fill="url(#colorApplications)" name="Applications" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Top Skills in Demand</CardTitle>
              </CardHeader>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topSkills} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="skill_name" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="candidate_count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Candidates" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Candidate Status */}
            <Card>
              <CardHeader>
                <CardTitle>Candidate Distribution</CardTitle>
              </CardHeader>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={55}
                    paddingAngle={3}
                    label={({ status, percent }) =>
                      `${status?.replace(/_/g, ' ')} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Department Capacity */}
          <Card>
            <CardHeader>
              <CardTitle>Department Capacity Overview</CardTitle>
            </CardHeader>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptCapacity} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department_name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="capacity" fill="#e2e8f0" name="Capacity" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current_count" fill="#3b82f6" name="Current" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </Layout>
  )
}
