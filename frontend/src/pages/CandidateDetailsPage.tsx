import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { ProgressBar, SkeletonText, Select } from '@/components/ui/Form'
import { FileUpload } from '@/components/ui/FileUpload'
import {
  BrainIcon, AIIcon, LinkIcon, FileUploadIcon, CheckIcon, UsersIcon
} from '@/assets/svg/Icons'
import { candidatesApi, aiApi, departmentsApi, applicationsApi } from '@/services/api'
import toast from 'react-hot-toast'

export const CandidateDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'ai'>('overview')
  const [selectedDeptId, setSelectedDeptId] = useState<string>('')

  const { data: candidate, isLoading: loading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => candidatesApi.get(Number(id)).then(res => res.data),
    enabled: !!id,
    refetchInterval: (query) => query.state.data?.workflow_stage === 'ai_processing' ? 3000 : false,
  })

  const { data: departmentsResponse } = useQuery({
    queryKey: ['departments', 'all'],
    queryFn: () => departmentsApi.list({ size: 100 }),
  })
  
  const departmentOptions = [
    { value: '', label: 'Select Dept...' },
    ...(departmentsResponse?.data?.items?.map(d => ({ value: String(d.id), label: d.name })) || [])
  ]

  const applyMutation = useMutation({
    mutationFn: () => applicationsApi.create({ candidate_id: Number(id), department_id: Number(selectedDeptId) }),
    onSuccess: () => {
      toast.success('Successfully applied to department!')
      setSelectedDeptId('')
      navigate('/applications')
    },
    onError: () => toast.error('Failed to create application (maybe already applied?)')
  })

  const analyzeMutation = useMutation({
    mutationFn: () => aiApi.runAnalysis(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate', id] })
      toast.success('AI analysis started in background')
    },
    onError: () => toast.error('Failed to start AI analysis')
  })

  const cvMutation = useMutation({
    mutationFn: (file: File) => candidatesApi.uploadCv(Number(id), file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate', id] })
      toast.success('CV uploaded successfully')
    },
    onError: () => toast.error('Failed to upload CV')
  })

  const deleteMutation = useMutation({
    mutationFn: () => candidatesApi.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate deleted')
      navigate('/candidates')
    },
    onError: () => toast.error('Failed to delete candidate')
  })

  if (loading) {
    return (
      <Layout title="Candidate Details">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card><SkeletonText lines={5} /></Card>
        </div>
      </Layout>
    )
  }

  if (!candidate) {
    return <Layout title="Not Found"><p>Candidate not found.</p></Layout>
  }

  const isAnalyzing = candidate.workflow_stage === 'ai_processing'

  return (
    <Layout title="Candidate Details">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              {candidate.first_name?.[0] || '?'}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {candidate.first_name} {candidate.last_name}
                  </h1>
                  <p className="text-slate-500">{candidate.email}</p>
                  <p className="text-slate-500 text-sm mt-0.5">
                    {candidate.degree || 'Degree not specified'} · {candidate.university || 'University not specified'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={candidate.status} />
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 capitalize">
                      Stage: {candidate.workflow_stage.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 capitalize">
                      Source: {candidate.intake_source.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Select
                      className="!w-40 !py-1 !text-sm"
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      options={departmentOptions}
                    />
                    <Button 
                      size="sm"
                      disabled={!selectedDeptId}
                      loading={applyMutation.isPending}
                      onClick={() => applyMutation.mutate()}
                    >
                      Apply
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/candidates/${candidate.id}/edit`)}>
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this candidate?')) {
                          deleteMutation.mutate()
                        }
                      }}
                      loading={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                {candidate.linkedin_url && (
                  <a href={candidate.linkedin_url} target="_blank" rel="noreferrer">
                    <Badge variant="info">
                      <LinkIcon /> LinkedIn
                    </Badge>
                  </a>
                )}
                {candidate.github_url && (
                  <a href={candidate.github_url} target="_blank" rel="noreferrer">
                    <Badge variant="neutral">
                      <LinkIcon /> GitHub
                    </Badge>
                  </a>
                )}
                <span className="text-sm text-slate-400">📞 {candidate.phone || 'N/A'}</span>
                {candidate.date_of_birth && (
                  <span className="text-sm text-slate-400">🎂 {candidate.date_of_birth}</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <BrainIcon className="h-4 w-4" /> AI Analysis
            {candidate.ai_score > 0 && <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 text-[10px]">{candidate.ai_score}%</span>}
          </button>
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="md:col-span-2">
              <CardHeader><CardTitle>Experience & Certifications</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Work Experience</h4>
                  {candidate.work_experience?.length ? (
                    <div className="space-y-3">
                      {candidate.work_experience.map((job: any, index: number) => (
                        <div key={index} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {job.job_title || job.role || 'Position'}
                            {job.company ? ` · ${job.company}` : ''}
                          </p>
                          <p className="text-xs text-slate-500">
                            {[job.start_date, job.end_date].filter(Boolean).join(' - ')}
                          </p>
                          {job.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{job.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-400">No work experience recorded</p>}
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Certifications</h4>
                  {candidate.certifications?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {candidate.certifications.map((cert: any, index: number) => (
                        <Badge key={index} variant="info">
                          {typeof cert === 'string' ? cert : cert.name || cert.title || 'Certification'}
                        </Badge>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-400">No certifications recorded</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
                <span className="text-xs text-slate-400">{candidate.skills?.length || 0} skills</span>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {candidate.skills && candidate.skills.length > 0 ? (
                  candidate.skills.map((skill) => (
                    <Badge
                      key={skill.id}
                      variant={
                        skill.level === 'expert' ? 'success' :
                        skill.level === 'advanced' ? 'info' :
                        skill.level === 'intermediate' ? 'warning' : 'neutral'
                      }
                    >
                      {skill.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm">No skills recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Files */}
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <FileUploadIcon className="h-5 w-5 text-slate-400" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <FileUpload 
                    label={candidate.cv_file ? "Update CV" : "Upload CV"}
                    onFileSelect={(file) => {
                      if (file) cvMutation.mutate(file)
                    }}
                    accept={{ 'application/pdf': ['.pdf'], 'application/msword': ['.doc', '.docx'] }}
                  />
                  {candidate.cv_file && (
                    <div className="mt-2 p-2 rounded bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm flex justify-between items-center">
                      <span>CV uploaded</span>
                      <a href={`/api/v1/uploads/${candidate.cv_file}`} target="_blank" rel="noreferrer" className="underline font-medium">View</a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── AI TAB ── */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">AI Analysis Engine</h3>
                <p className="text-sm text-slate-500">Run the full pipeline (Parsing → Skill Extraction → Matching → LLM Enrichment)</p>
              </div>
              <Button
                onClick={() => analyzeMutation.mutate()}
                loading={isAnalyzing || analyzeMutation.isPending}
                disabled={isAnalyzing || !candidate.cv_file}
                icon={<AIIcon className="h-4 w-4" />}
              >
                {isAnalyzing ? 'Analyzing...' : 'Run Full Analysis'}
              </Button>
            </div>

            {!candidate.cv_file && (
              <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-yellow-700 dark:text-yellow-400 text-sm">
                ⚠️ A CV must be uploaded before running AI analysis.
              </div>
            )}

            {isAnalyzing && (
              <Card>
                <CardContent className="py-12 text-center space-y-4">
                  <div className="inline-flex gap-1.5 items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <p className="text-slate-500 text-sm">AI is analyzing the candidate... This usually takes 10-15 seconds.</p>
                </CardContent>
              </Card>
            )}

            {!isAnalyzing && candidate.ai_score > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Score & Dept */}
                  <Card className="md:col-span-1 border-blue-100 dark:border-blue-900/50 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-950/20">
                    <CardContent className="pt-6 text-center">
                      <div className="text-6xl font-black bg-gradient-to-br from-blue-600 to-violet-600 bg-clip-text text-transparent mb-2">
                        {candidate.ai_score}%
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Match Score</p>
                      
                      <div className="mt-6 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Recommended</p>
                        <p className="font-semibold text-blue-700 dark:text-blue-400">
                          {candidate.recommended_department_id ? `Dept #${candidate.recommended_department_id}` : 'General'}
                        </p>
                        <p className="text-xs text-slate-500 mt-2 italic">{candidate.ai_explanation}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Summary & Gap Analysis */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>AI Profile Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                        {candidate.ai_summary}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                          <h4 className="text-sm font-semibold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2">
                            <span className="text-green-500">✓</span> Matched Skills
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {candidate.ai_matched_skills?.map(s => (
                              <span key={s} className="text-xs px-2 py-1 bg-white dark:bg-slate-900 rounded text-slate-600 dark:text-slate-300">{s}</span>
                            ))}
                            {!candidate.ai_matched_skills?.length && <span className="text-xs text-slate-400">None</span>}
                          </div>
                        </div>

                        <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                          <h4 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">
                            <span className="text-red-500">✗</span> Missing Skills
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {candidate.ai_missing_skills?.map(s => (
                              <span key={s} className="text-xs px-2 py-1 bg-white dark:bg-slate-900 rounded text-slate-600 dark:text-slate-300">{s}</span>
                            ))}
                            {!candidate.ai_missing_skills?.length && <span className="text-xs text-slate-400">None</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths & Weaknesses */}
                  <Card>
                    <CardHeader><CardTitle>Strengths & Weaknesses</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Strengths</h4>
                        <ul className="space-y-1.5">
                          {candidate.ai_strengths?.map((s, i) => (
                            <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">•</span> <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Areas for Growth</h4>
                        <ul className="space-y-1.5">
                          {candidate.ai_weaknesses?.map((s, i) => (
                            <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                              <span className="text-orange-500 mt-0.5">•</span> <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Interview Questions */}
                  <Card>
                    <CardHeader><CardTitle>Suggested Interview Questions</CardTitle></CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {candidate.ai_interview_questions?.map((q, i) => (
                          <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                            <span className="text-blue-500 font-bold shrink-0">Q{i + 1}.</span>
                            <span>{q}</span>
                          </li>
                        ))}
                        {!candidate.ai_interview_questions?.length && (
                          <li className="text-sm text-slate-400">No questions generated.</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {!isAnalyzing && candidate.ai_score === 0 && (
              <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <BrainIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Run AI Analysis to see insights, scores, and generated interview questions.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
