import React, { useEffect, useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar, Select } from '@/components/ui/Form'
import { applicationsApi } from '@/services/api'
import type { Application, ApplicationStatus } from '@/types'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
]

export const ApplicationsPage = () => {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchApps = async () => {
    setLoading(true)
    try {
      const res = await applicationsApi.list({
        page,
        size: 50,
        status: status as ApplicationStatus || undefined,
      })
      setApplications(res.data.items)
      setTotalPages(res.data.pages)
      setTotal(res.data.total)
    } catch {
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchApps() }, [page, status])

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await applicationsApi.updateStatus(id, newStatus)
      toast.success('Status updated')
      fetchApps()
    } catch {
      toast.error('Update failed')
    }
  }

  return (
    <Layout title="Applications">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="w-full sm:w-48"
        />
        <span className="text-sm text-slate-500 dark:text-slate-400 self-center sm:ml-auto">
          {total} application{total !== 1 ? 's' : ''}
        </span>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-6 py-3.5 font-medium text-slate-600 dark:text-slate-400">ID</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-600 dark:text-slate-400">Candidate</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-600 dark:text-slate-400">Department</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-600 dark:text-slate-400">Match Score</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-600 dark:text-slate-400">Status</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-600 dark:text-slate-400">Date</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    No applications found
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">#{app.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {app.candidate ? `${app.candidate.first_name} ${app.candidate.last_name}` : `Candidate #${app.candidate_id}`}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {app.department?.name || `Dept #${app.department_id}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={app.matching_score} size="sm" className="w-20" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {app.matching_score}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <select
                          className="bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1.5 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          value={app.status}
                          onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="under_review">Under Review</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                          <option value="withdrawn">Withdrawn</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm text-slate-600 px-2">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      )}
    </Layout>
  )
}
