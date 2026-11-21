import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { aiApi, candidatesApi, departmentsApi, applicationsApi } from '@/services/api'
import { ChevronIcon, CheckIcon, XIcon, UsersIcon, DepartmentIcon } from '@/assets/svg/Icons'
import toast from 'react-hot-toast'

export const DepartmentCandidateMatchPage = () => {
  const { deptId, candidateId } = useParams<{ deptId: string; candidateId: string }>()
  const navigate = useNavigate()

  const dId = parseInt(deptId || '0', 10)
  const cId = parseInt(candidateId || '0', 10)

  // Fetch basic candidate and department details
  const { data: candidateData } = useQuery({
    queryKey: ['candidate', cId],
    queryFn: () => candidatesApi.get(cId).then(res => res.data),
    enabled: !!cId,
  })

  const { data: deptData } = useQuery({
    queryKey: ['department', dId],
    queryFn: () => departmentsApi.get(dId).then(res => res.data),
    enabled: !!dId,
  })

  // Mutations for AI Analysis
  const analyzeMutation = useMutation({
    mutationFn: () => aiApi.analyzeMatch(cId, dId).then(res => res.data),
  })

  const questionsMutation = useMutation({
    mutationFn: () => aiApi.interviewQuestions(cId, dId).then(res => res.data),
  })

  const applyMutation = useMutation({
    mutationFn: () => applicationsApi.create({ candidate_id: cId, department_id: dId }),
    onSuccess: () => {
      toast.success('Successfully applied to department!')
      navigate('/applications')
    },
    onError: () => toast.error('Failed to create application (maybe already applied?)')
  })

  // Trigger mutations on load
  useEffect(() => {
    if (dId && cId) {
      analyzeMutation.mutate()
      questionsMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dId, cId])

  const analysis = analyzeMutation.data?.data
  const questions = questionsMutation.data?.data?.questions

  const isLoading = analyzeMutation.isPending || !candidateData || !deptData

  if (isLoading) {
    return (
      <Layout title="AI Match Analysis">
        <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </Layout>
    )
  }

  if (analyzeMutation.isError) {
    return (
      <Layout title="AI Match Analysis">
        <div className="text-center py-12 max-w-4xl mx-auto">
          <p className="text-red-500 mb-4">Failed to generate AI analysis.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="AI Match Analysis">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronIcon direction="left" className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              Detailed Match Analysis
            </h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              <UsersIcon className="h-4 w-4" /> {candidateData.first_name} {candidateData.last_name} 
              <span className="text-slate-300 dark:text-slate-700">|</span> 
              <DepartmentIcon className="h-4 w-4" /> {deptData.name}
            </p>
          </div>
          <Button
            onClick={() => applyMutation.mutate()}
            loading={applyMutation.isPending}
            className="ml-auto"
          >
            Create Application
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2">
                <CheckIcon className="h-5 w-5" /> Strengths (Points Forts)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis?.strengths?.length > 0 ? (
                <ul className="space-y-3">
                  {analysis.strengths.map((str: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-green-500 mt-0.5">•</span> {str}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No significant strengths identified.</p>
              )}
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                <XIcon className="h-5 w-5" /> Weaknesses (Points Faibles)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis?.weaknesses?.length > 0 ? (
                <ul className="space-y-3">
                  {analysis.weaknesses.map((wk: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-red-500 mt-0.5">•</span> {wk}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No significant weaknesses identified.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overall Fit & Recommendation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Detailed Analysis</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {analysis?.overall_fit}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
              <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">AI Recommendation</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {analysis?.recommendation}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Interview Questions</CardTitle>
          </CardHeader>
          <CardContent>
            {questionsMutation.isPending ? (
              <div className="text-sm text-slate-500 animate-pulse">Generating questions...</div>
            ) : questions && questions.length > 0 ? (
              <ul className="space-y-4">
                {questions.map((q: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <span className="font-bold text-slate-400">{i + 1}.</span> {q}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No questions generated.</p>
            )}
          </CardContent>
        </Card>

      </div>
    </Layout>
  )
}
