import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { auditApi } from '@/services/api'
import type { AuditLogEntry } from '@/types'

const ACTION_COLORS: Record<string, string> = {
  candidate_created: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  candidate_updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  candidate_deleted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  ai_analysis_completed: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  csv_import: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  application_created: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  application_status_changed: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  webhook_received: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  user_login: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  settings_changed: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
}

function ActionBadge({ action }: { action: string }) {
  const color = ACTION_COLORS[action] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {action.replace(/_/g, ' ')}
    </span>
  )
}

export const AuditLogPage = () => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['audit-log', page],
    queryFn: () => auditApi.list(page * PAGE_SIZE, PAGE_SIZE).then(r => r.data),
    staleTime: 30_000,
  })

  const filtered = search
    ? entries.filter(e =>
        e.action.includes(search.toLowerCase()) ||
        e.entity_type?.includes(search.toLowerCase()) ||
        JSON.stringify(e.details || {}).toLowerCase().includes(search.toLowerCase())
      )
    : entries

  return (
    <Layout title="Audit Log">
      <div className="space-y-4">
        {/* Search */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search actions, entities…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700
              rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500
              text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold">Action</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold">Entity</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold">Details</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold">User</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                      No audit log entries found
                    </td>
                  </tr>
                ) : (
                  filtered.map((entry: AuditLogEntry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3">
                        <ActionBadge action={entry.action} />
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {entry.entity_type && (
                          <span>
                            <span className="font-medium text-slate-900 dark:text-white">{entry.entity_type}</span>
                            {entry.entity_id && <span className="ml-1 text-slate-400">#{entry.entity_id}</span>}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {entry.details
                          ? Object.entries(entry.details)
                              .slice(0, 3)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' · ')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {entry.user_id ? `User #${entry.user_id}` : 'System'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">{filtered.length} entries</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={entries.length < PAGE_SIZE}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
