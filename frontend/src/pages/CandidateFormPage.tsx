import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layout } from '@/components/layout/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Form'
import { FileUpload } from '@/components/ui/FileUpload'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { candidatesApi, aiApi, departmentsApi, applicationsApi } from '@/services/api'
import toast from 'react-hot-toast'

const candidateSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  linkedin_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  github_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  university: z.string().optional(),
  degree: z.string().optional(),
  graduation_year: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val === '' || val === undefined || isNaN(Number(val)) ? undefined : Number(val)))
    .refine((val) => val === undefined || (val >= 2000 && val <= 2100), {
      message: 'Year must be between 2000 and 2100',
    }),
  education_history: z.array(
    z.object({
      university: z.string().optional(),
      degree: z.string().optional(),
      graduation_year: z
        .union([z.string(), z.number()])
        .optional()
        .transform((val) => (val === '' || val === undefined || isNaN(Number(val)) ? undefined : Number(val)))
        .refine((val) => val === undefined || (val >= 2000 && val <= 2100), {
          message: 'Year must be between 2000 and 2100',
        }),
    })
  ).optional(),
  work_experience: z.array(
    z.object({
      company: z.string().optional(),
      job_title: z.string().optional(),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
      description: z.string().optional(),
    })
  ).optional(),
  certifications: z.string().optional(),
  skills: z.string().optional(),
  department_id: z.string().optional(),
})

type CandidateFormValues = z.infer<typeof candidateSchema>

export const CandidateFormPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = Boolean(id)

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      education_history: [{ university: '', degree: '', graduation_year: undefined }],
      work_experience: [],
      certifications: '',
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "education_history"
  });
  const { fields: experienceFields, append: appendExperience, remove: removeExperience, replace: replaceExperience } = useFieldArray({
    control,
    name: "work_experience"
  });

  const [cvFile, setCvFile] = useState<File | null>(null)
  const [parsingStep, setParsingStep] = useState<string | null>(null)

  const parseCvMutation = useMutation({
    mutationFn: (file: File) => aiApi.analyzeCv(file).then(res => res.data),
    onSuccess: (res) => {
      if (res.data && !res.data.error) {
        toast.success('CV Parsed successfully!')
        if (res.data.first_name) setValue('first_name', res.data.first_name)
        if (res.data.last_name) setValue('last_name', res.data.last_name)
        if (res.data.email) setValue('email', res.data.email)
        if (res.data.phone) setValue('phone', res.data.phone)
        if (res.data.date_of_birth) setValue('date_of_birth', res.data.date_of_birth)
        if (res.data.linkedin_url) setValue('linkedin_url', res.data.linkedin_url)
        if (res.data.github_url) setValue('github_url', res.data.github_url)
        if (res.data.education_history && res.data.education_history.length > 0) {
          setValue('education_history', res.data.education_history)
        } else {
          setValue('education_history', [{
            university: res.data.university || '',
            degree: res.data.degree || '',
            graduation_year: res.data.graduation_year
          }])
        }
        if (Array.isArray(res.data.work_experience)) {
          replaceExperience(res.data.work_experience)
        }
        if (Array.isArray(res.data.certifications)) {
          setValue('certifications', res.data.certifications.map((item: any) =>
            typeof item === 'string' ? item : item.name || item.title || ''
          ).filter(Boolean).join(', '))
        }
        if (res.data.skills && Array.isArray(res.data.skills)) {
          setValue('skills', res.data.skills.join(', '))
        }
      } else if (res.data?.error) {
        toast.error(`Failed to parse CV: ${res.data.error}`)
      }
    },
    onError: (error) => {
      const response = (error as Error & {
        response?: { data?: { detail?: string } }
      }).response
      const detail = response?.data?.detail
      toast.error(detail ? `Failed to parse CV: ${detail}` : 'Failed to parse CV')
    }
  })

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (parseCvMutation.isPending) {
      const steps = [
        'Uploading CV...',
        'Extracting information...',
        'Analyzing CV...',
        'Populating candidate information...'
      ]
      let currentStep = 0
      setParsingStep(steps[currentStep])
      
      interval = setInterval(() => {
        currentStep = (currentStep + 1) % steps.length
        setParsingStep(steps[currentStep])
      }, 1500)
    } else {
      setParsingStep(null)
    }
    
    return () => clearInterval(interval)
  }, [parseCvMutation.isPending])

  // Fetch candidate if editing
  const { data: candidate, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => candidatesApi.get(Number(id)).then(res => res.data),
    enabled: isEditing,
  })

  useEffect(() => {
    if (candidate) {
      reset({
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        email: candidate.email,
        phone: candidate.phone || '',
        date_of_birth: candidate.date_of_birth || '',
        linkedin_url: candidate.linkedin_url || '',
        github_url: candidate.github_url || '',
        education_history: candidate.education_history?.length 
          ? candidate.education_history 
          : [{ 
              university: candidate.university || '', 
              degree: candidate.degree || '', 
              graduation_year: candidate.graduation_year 
            }],
        work_experience: candidate.work_experience || [],
        certifications: (candidate.certifications || []).map((item: any) =>
            typeof item === 'string' ? item : item.name || item.title || ''
        ).join(', '),
        skills: candidate.skills?.map((s: any) => s.name).join(', ') || '',
      })
    }
  }, [candidate, reset])

  const { data: departmentsResponse } = useQuery({
    queryKey: ['departments', 'all'],
    queryFn: () => departmentsApi.list({ size: 100 }),
  })
  
  const departmentOptions = [
    { value: '', label: 'None (Add to pool only)' },
    ...(departmentsResponse?.data?.items?.map(d => ({ value: String(d.id), label: d.name })) || [])
  ]

  const mutation = useMutation({
    mutationFn: async (data: CandidateFormValues) => {
      const payload = {
        ...data,
        skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : []
        , certifications: data.certifications
          ? data.certifications.split(',').map(s => s.trim()).filter(Boolean)
          : []
      }
      const res = isEditing ? await candidatesApi.update(Number(id), payload) : await candidatesApi.create(payload)
      if (!isEditing && cvFile && res.data?.id) {
        await candidatesApi.uploadCv(res.data.id, cvFile)
      }
      
      // If a department is selected and this is a new candidate, auto-create the application
      if (!isEditing && data.department_id && res.data?.id) {
        await applicationsApi.create({
          candidate_id: res.data.id,
          department_id: Number(data.department_id)
        })
      }
      
      return res
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success(isEditing ? 'Candidate updated!' : 'Candidate created!')
      if (!isEditing && res.data?.id) {
        navigate(`/candidates/${res.data.id}`)
      } else {
        navigate('/candidates')
      }
    },
    onError: () => {
      toast.error('Failed to save candidate')
    }
  })

  const onSubmit = (data: CandidateFormValues) => {
    // Sync first education to root legacy fields
    if (data.education_history && data.education_history.length > 0) {
      data.university = data.education_history[0].university;
      data.degree = data.education_history[0].degree;
      data.graduation_year = data.education_history[0].graduation_year;
    }
    mutation.mutate(data)
  }

  if (isEditing && isLoading) return <Layout title="Loading..."><div /></Layout>

  return (
    <Layout title={isEditing ? 'Edit Candidate' : 'Create Candidate'}>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Candidate Information' : 'New Candidate Information'}</CardTitle>
          </CardHeader>
          <CardContent>
            {!isEditing && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Auto-fill with AI</h4>
                  {parseCvMutation.isPending && (
                    <span className="text-xs text-indigo-500 animate-pulse font-medium">{parsingStep || 'Parsing CV...'}</span>
                  )}
                </div>
                <FileUpload
                  label="Upload CV (PDF, DOCX, JPG, PNG)"
                  selectedFile={cvFile}
                  onFileSelect={(file) => {
                    if (file) {
                      setCvFile(file)
                      parseCvMutation.mutate(file)
                    }
                  }}
                  accept={{ 
                    'application/pdf': ['.pdf'],
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                    'image/jpeg': ['.jpg', '.jpeg'],
                    'image/png': ['.png']
                  }}
                />
                <hr className="mt-6 border-slate-200 dark:border-slate-700/60" />
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  {...register('first_name')}
                  error={errors.first_name?.message}
                />
                <Input
                  label="Last Name"
                  {...register('last_name')}
                  error={errors.last_name?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  disabled={isEditing}
                />
                <Input
                  label="Phone Number"
                  {...register('phone')}
                  error={errors.phone?.message}
                />
                <Input
                  label="Date of Birth / Age"
                  {...register('date_of_birth')}
                  error={errors.date_of_birth?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <Input
                  label="LinkedIn URL"
                  {...register('linkedin_url')}
                  error={errors.linkedin_url?.message}
                />
                <Input
                  label="GitHub URL"
                  {...register('github_url')}
                  error={errors.github_url?.message}
                />
              </div>
              <div className="mt-6 border-t border-slate-200 dark:border-slate-700/60 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-slate-800 dark:text-white">Education History</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ university: '', degree: '', graduation_year: undefined })}>
                    + Add Degree
                  </Button>
                </div>

                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg relative bg-slate-50 dark:bg-slate-900/50">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="absolute top-2 right-2 text-slate-400 hover:text-red-500 font-bold"
                        >
                          &times; Remove
                        </button>
                      )}
                      
                      <div className="grid grid-cols-1 gap-4 mb-4 mt-2">
                        <Input
                          label="University / Institution"
                          {...register(`education_history.${index}.university` as const)}
                          error={errors.education_history?.[index]?.university?.message}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Degree / Diploma"
                          {...register(`education_history.${index}.degree` as const)}
                          error={errors.education_history?.[index]?.degree?.message}
                        />
                        <Input
                          label="Graduation Year"
                          type="number"
                          {...register(`education_history.${index}.graduation_year` as const)}
                          error={errors.education_history?.[index]?.graduation_year?.message}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 dark:border-slate-700/60 pt-6">
                <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4">Work Experience</h3>
                <div className="space-y-4">
                  {experienceFields.length === 0 && (
                    <p className="text-sm text-slate-500">Work experience extracted from the CV will appear here.</p>
                  )}
                  {experienceFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-2 gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <Input label="Company" {...register(`work_experience.${index}.company` as const)} />
                      <Input label="Job title" {...register(`work_experience.${index}.job_title` as const)} />
                      <Input label="Start date" {...register(`work_experience.${index}.start_date` as const)} />
                      <Input label="End date" {...register(`work_experience.${index}.end_date` as const)} />
                      <div className="col-span-2">
                        <Input label="Description" {...register(`work_experience.${index}.description` as const)} />
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => removeExperience(index)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => appendExperience({
                    company: '', job_title: '', start_date: '', end_date: '', description: ''
                  })}>
                    + Add Experience
                  </Button>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 dark:border-slate-700/60 pt-6">
                <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4">Certifications</h3>
                <Input
                  label="Certifications (comma separated)"
                  placeholder="e.g. AWS Certified Cloud Practitioner, Google Data Analytics"
                  {...register('certifications')}
                />
              </div>
              
              <div className="mt-6 border-t border-slate-200 dark:border-slate-700/60 pt-6">
                <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4">Skills</h3>
                <Input
                  label="Skills (comma separated)"
                  placeholder="e.g. React, Node.js, Python"
                  {...register('skills')}
                  error={errors.skills?.message}
                />
              </div>

              {!isEditing && (
                <div className="mt-6 border-t border-slate-200 dark:border-slate-700/60 pt-6">
                  <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4">Application details</h3>
                  <Select
                    label="Apply to Department"
                    options={departmentOptions}
                    {...register('department_id')}
                    error={errors.department_id?.message}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    If you select a department, this candidate will automatically show up in the Applications tab for that department.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => navigate('/candidates')}>
                  Cancel
                </Button>
                <Button type="submit" loading={mutation.isPending}>
                  {isEditing ? 'Save Changes' : 'Create Candidate'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
