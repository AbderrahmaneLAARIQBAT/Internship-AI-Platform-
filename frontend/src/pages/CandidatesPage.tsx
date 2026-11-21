import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/useDebounce'
import toast from 'react-hot-toast'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { ProgressBar, SkeletonCard, Select } from '@/components/ui/Form'
import { PlusIcon, EyeIcon, BrainIcon, TrashIcon } from '@/assets/svg/Icons'
import { candidatesApi } from '@/services/api'
import type { CandidateStatus } from '@/types'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
]

export const CandidatesPage = () => {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const SIZE = 10

  const debouncedSearch = useDebounce(search, 400)

  const queryClient = useQueryClient()

  const { data, isLoading: loading } = useQuery({
    queryKey: ['candidates', page, debouncedSearch, status],
    queryFn: () => candidatesApi.list({
      page,
      size: SIZE,
      search: debouncedSearch || undefined,
      status: status as CandidateStatus || undefined,
    }).then(res => res.data)
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => candidatesApi.delete(id),
    onSuccess: () => {
      toast.success('Candidate deleted')
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
    onError: () => toast.error('Failed to delete candidate')
  })

  const candidates = data?.items || []
  const total = data?.total || 0
  const totalPages = data?.pages || 1

  return (
    <Layout title="Candidates" search={search} onSearch={(v) => { setSearch(v); setPage(1) }}>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="w-full sm:w-48"
        />
        <div className="sm:ml-auto">
          <Link to="/candidates/new">
            <Button icon={<PlusIcon className="h-4 w-4" />}>Add Candidate</Button>
          </Link>
        </div>
      </div>

      <div className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        {total} candidate{total !== 1 ? 's' : ''} found
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <svg viewBox="0 0 120 120" className="w-28 h-28 mb-4 opacity-20" fill="currentColor">
            <circle cx="60" cy="45" r="25" />
            <path d="M20 100 Q60 70 100 100" strokeWidth="8" stroke="currentColor" fill="none" strokeLinecap="round" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">No candidates found</h3>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
          <Link to="/candidates/new" className="mt-4">
            <Button icon={<PlusIcon className="h-4 w-4" />}>Add First Candidate</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {candidates.map((c) => (
            <Card key={c.id} hover className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                  {c.first_name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                    {c.first_name} {c.last_name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{c.university || 'No university'}</p>
                  <p className="text-xs text-slate-400">{c.degree || 'No degree'}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span className="flex items-center gap-1">
                    <BrainIcon className="h-3.5 w-3.5" />
                    AI Score
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{c.ai_score}%</span>
                </div>
                <ProgressBar value={c.ai_score} size="md" />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {c.graduation_year ? `Class of ${c.graduation_year}` : 'N/A'}
                </span>
                <div className="flex gap-1">
                  <Link to={`/candidates/${c.id}/edit`}>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </Link>
                  <Link to={`/candidates/${c.id}`}>
                    <Button variant="ghost" size="sm" icon={<EyeIcon className="h-4 w-4" />}>
                      View
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this candidate?')) {
                        deleteMutation.mutate(c.id)
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm text-slate-600 dark:text-slate-400 px-2">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      )}
    </Layout>
  )
}
