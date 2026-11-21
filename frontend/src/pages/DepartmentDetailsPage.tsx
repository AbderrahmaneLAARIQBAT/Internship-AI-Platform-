import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { departmentsApi, applicationsApi, aiApi, candidatesApi } from '@/services/api'
import { ChevronIcon, DepartmentIcon, UsersIcon, CheckIcon, XIcon, EditIcon } from '@/assets/svg/Icons'
import toast from 'react-hot-toast'

export const DepartmentDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const deptId = parseInt(id || '0', 10)

  const { data: deptData, isLoading: loadingDept } = useQuery({
    queryKey: ['department', deptId],
    queryFn: () => departmentsApi.get(deptId).then(res => res.data),
    enabled: !!deptId,
  })

  const { data: appsData, isLoading: loadingApps } = useQuery({
    queryKey: ['department-applications', deptId],
    queryFn: () => applicationsApi.list({ department_id: deptId, size: 50 }).then(res => res.data),
    enabled: !!deptId,
  })

  const queryClient = useQueryClient()

  const [rankings, setRankings] = React.useState<any[]>([])
  
  const [showEditModal, setShowEditModal] = React.useState(false)
  const [editDeptData, setEditDeptData] = React.useState({ name: '', description: '', capacity: 10 })

  const editMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; capacity?: number }) => departmentsApi.update(deptId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department', deptId] })
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setShowEditModal(false)
      toast.success('Department updated successfully')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to update department')
  })


  const rankMutation = useMutation({
    mutationFn: async (dId: number) => {
      const cands = await candidatesApi.list({ size: 20, status: 'pending' })
      const candidateIds = cands.data.items.map(c => c.id)
      if (candidateIds.length === 0) throw new Error('No candidates to rank')
      const res = await aiApi.rankCandidates(candidateIds, dId)
      return res.data.data.rankings
    },
    onSuccess: (data: any) => {
      setRankings(data)
      toast.success('AI Ranked Candidates successfully!')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to rank candidates')
    }
  })

  if (loadingDept) {
    return (
      <Layout title="Department Details">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </Layout>
    )
  }

  if (!deptData) {
    return (
      <Layout title="Department Not Found">
        <div className="text-center py-12">
          <p className="text-slate-500">Could not find the specified department.</p>
          <Button className="mt-4" onClick={() => navigate('/departments')}>Back to Departments</Button>
        </div>
      </Layout>
    )
  }

  const fill = deptData.capacity > 0 ? Math.round((deptData.current_count / deptData.capacity) * 100) : 0
  const statusColor = fill >= 90 ? 'danger' : fill >= 70 ? 'warning' : 'success'
  const applications = appsData?.items || []

  return (
    <Layout title={deptData.name}>
      <div className="mb-6 flex items-center gap-3">
        <button 
          onClick={() => navigate('/departments')}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronIcon direction="left" className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <DepartmentIcon className="h-5 w-5" />
            </div>
            {deptData.name}
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 px-2"
              onClick={() => {
                setEditDeptData({
                  name: deptData.name,
                  description: deptData.description || '',
                  capacity: deptData.capacity
                })
                setShowEditModal(true)
              }}
            >
              <EditIcon className="h-4 w-4 text-slate-500" />
            </Button>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Department Overview</CardTitle>
            </CardHeader>
            <div className="space-y-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {deptData.description || 'No description provided for this department.'}
              </p>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500 flex items-center gap-2">
                    <UsersIcon className="h-4 w-4" /> Capacity
                  </span>
                  <Badge variant={statusColor}>{deptData.current_count} / {deptData.capacity}</Badge>
                </div>
                <ProgressBar value={fill} size="lg" />
              </div>

              {deptData.skills && deptData.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {deptData.skills.map((s: any) => (
                      <Badge key={s.id} variant="info">{s.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* AI Match Candidates Card */}
          <Card>
            <CardHeader>
              <CardTitle>AI Match Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full mb-4"
                onClick={() => rankMutation.mutate(deptId)}
                loading={rankMutation.isPending}
              >
                Find Best Matches
              </Button>

              {rankings.length > 0 && (
                <div className="space-y-3">
                  {rankings.map((r, i) => (
                    <div 
                      key={r.id} 
                      onClick={() => navigate(`/departments/${deptId}/candidates/${r.id}`)}
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
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Candidates */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Applied Candidates</CardTitle>
              <Badge variant="neutral">{applications.length} Total</Badge>
            </CardHeader>
            
            {loadingApps ? (
              <div className="p-4 text-center text-slate-500 text-sm">Loading candidates...</div>
            ) : applications.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl m-4">
                No candidates have applied to this department yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">Candidate</th>
                      <th className="px-6 py-4 font-medium text-center">AI Score</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                              {app.candidate?.first_name?.[0] || 'C'}
                            </div>
                            <div>
                              <p 
                                className="font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                                onClick={() => navigate(`/departments/${deptId}/candidates/${app.candidate_id}`)}
                              >
                                {app.candidate ? `${app.candidate.first_name} ${app.candidate.last_name}` : `Candidate #${app.candidate_id}`}
                              </p>
                              <p className="text-xs text-slate-500">{app.candidate?.email || 'No email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant={app.matching_score >= 80 ? 'success' : app.matching_score >= 50 ? 'warning' : 'danger'}>
                            {app.matching_score}%
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={app.status === 'accepted' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning'}>
                            {app.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => navigate(`/departments/${deptId}/candidates/${app.candidate_id}`)}
                            >
                              View Match
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => navigate(`/applications`)}
                            >
                              Manage
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-semibold text-lg text-slate-900 dark:text-white">Edit Department</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  value={editDeptData.name}
                  onChange={e => setEditDeptData({ ...editDeptData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={editDeptData.description}
                  onChange={e => setEditDeptData({ ...editDeptData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={editDeptData.capacity}
                  onChange={e => setEditDeptData({ ...editDeptData, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button 
                onClick={() => editMutation.mutate(editDeptData)}
                loading={editMutation.isPending}
                disabled={!editDeptData.name}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
