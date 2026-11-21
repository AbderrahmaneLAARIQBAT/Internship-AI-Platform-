import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { aiApi, candidatesApi, departmentsApi } from '@/services/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar, SkeletonCard } from '@/components/ui/Form'
import { PlusIcon, DepartmentIcon, UsersIcon, TrashIcon, XIcon } from '@/assets/svg/Icons'
import type { Department } from '@/types'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export const DepartmentsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [search, setSearch] = useState('')
  const [expandedDept, setExpandedDept] = useState<number | null>(null)
  const [rankings, setRankings] = useState<any[]>([])

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newDeptData, setNewDeptData] = useState({ name: '', description: '', capacity: 10 })

  const { data: departmentsData, isLoading: loading } = useQuery({
    queryKey: ['departments', search],
    queryFn: () => departmentsApi.list({ search: search || undefined }).then(res => res.data)
  })

  const departments = departmentsData?.items || []

  const rankMutation = useMutation({
    mutationFn: async (deptId: number) => {
      // Fetch some candidates to rank (e.g. pending ones)
      const cands = await candidatesApi.list({ size: 20, status: 'pending' })
      const candidateIds = cands.data.items.map(c => c.id)
      if (candidateIds.length === 0) throw new Error('No candidates to rank')
      const res = await aiApi.rankCandidates(candidateIds, deptId)
      return res.data.data.rankings
    },
    onSuccess: (data, deptId) => {
      setRankings(data)
      setExpandedDept(deptId)
      toast.success('AI Ranked Candidates successfully!')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to rank candidates')
    }
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string; capacity: number }) => departmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setShowAddModal(false)
      setNewDeptData({ name: '', description: '', capacity: 10 })
      toast.success('Department created successfully')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to create department')
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => departmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Department deleted')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to delete department')
  })

  const fillPercent = (d: Department) =>
    d.capacity > 0 ? Math.round((d.current_count / d.capacity) * 100) : 0

  return (
    <Layout title="Departments" search={search} onSearch={setSearch}>
      <div className="flex justify-end mb-6">
        <Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => setShowAddModal(true)}>Add Department</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {departments.map((dept) => {
            const fill = fillPercent(dept)
            const statusColor = fill >= 90 ? 'danger' : fill >= 70 ? 'warning' : 'success'
            return (
              <Card key={dept.id} hover className="cursor-pointer" onClick={() => navigate(`/departments/${dept.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center flex-shrink-0">
                      <DepartmentIcon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">{dept.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{dept.description || 'No description'}</p>
                    </div>
                  </div>
                  
                  {(user?.role === 'admin' || user?.role === 'hr') && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Are you sure you want to delete ${dept.name}?`)) {
                          deleteMutation.mutate(dept.id)
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500 flex items-center gap-1">
                        <UsersIcon className="h-3 w-3" /> Capacity
                      </span>
                      <Badge variant={statusColor}>{dept.current_count}/{dept.capacity}</Badge>
                    </div>
                    <ProgressBar value={fill} size="md" />
                  </div>

                  {dept.skills && dept.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {dept.skills.slice(0, 4).map((s) => (
                        <Badge key={s.id} variant="info">{s.name}</Badge>
                      ))}
                      {dept.skills.length > 4 && (
                        <Badge variant="neutral">+{dept.skills.length - 4}</Badge>
                      )}
                    </div>
                  )}

                  <hr className="my-3 border-slate-100 dark:border-slate-800" />
                  
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation()
                        rankMutation.mutate(dept.id)
                      }}
                      loading={rankMutation.isPending && rankMutation.variables === dept.id}
                    >
                      AI Match Candidates
                    </Button>
                    {expandedDept === dept.id && (
                      <Button variant="ghost" size="sm" onClick={() => setExpandedDept(null)}>
                        Hide
                      </Button>
                    )}
                  </div>

                  {expandedDept === dept.id && rankings.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">Top AI Matches</h4>
                      {rankings.map((r, i) => (
                        <div 
                          key={r.id} 
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/departments/${dept.id}/candidates/${r.id}`)
                          }}
                          className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        >
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-slate-700 dark:text-slate-300">#{i + 1} {r.name}</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{r.matching_score}%</span>
                          </div>
                          
                          {(r.strengths?.length > 0 || r.weaknesses?.length > 0) && (
                            <div className="flex flex-col gap-1 mt-1 text-xs">
                              {r.strengths?.length > 0 && (
                                <p className="text-slate-600 dark:text-slate-400 line-clamp-1">
                                  <span className="text-green-500 font-semibold mr-1">+</span> 
                                  {r.strengths.join(', ')}
                                </p>
                              )}
                              {r.weaknesses?.length > 0 && (
                                <p className="text-slate-600 dark:text-slate-400 line-clamp-1">
                                  <span className="text-red-500 font-semibold mr-1">-</span> 
                                  {r.weaknesses.join(', ')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-semibold text-lg text-slate-900 dark:text-white">Add Department</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  value={newDeptData.name}
                  onChange={e => setNewDeptData({ ...newDeptData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="e.g. Engineering"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={newDeptData.description}
                  onChange={e => setNewDeptData({ ...newDeptData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Department details..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={newDeptData.capacity}
                  onChange={e => setNewDeptData({ ...newDeptData, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button 
                onClick={() => createMutation.mutate(newDeptData)}
                loading={createMutation.isPending}
                disabled={!newDeptData.name}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
