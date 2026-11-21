import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import type {
  Token, LoginRequest, RegisterRequest, User,
  Candidate, CandidateCreate, CandidateUpdate, Paginated,
  Department, DepartmentCreate,
  Application, ApplicationCreate,
  DashboardStats, CandidatesByStatus, TopSkill, DepartmentCapacity, ActivityTrend,
  APIResponse, Notification, AuditLogEntry, ImportSummary,
} from '@/types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ── Request interceptor: attach JWT ───────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: handle 401 & token refresh ─────────────────────────
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            if (original.headers) original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }
      isRefreshing = true
      try {
        const res = await axios.post<Token>(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })
        const { access_token, refresh_token } = res.data
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)
        refreshQueue.forEach((cb) => cb(access_token))
        refreshQueue = []
        if (original.headers) original.headers.Authorization = `Bearer ${access_token}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth API ───────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: LoginRequest) => api.post<Token>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<User>('/auth/register', data),
  refresh: (refresh_token: string) => api.post<Token>('/auth/refresh', { refresh_token }),
  me: () => api.get<User>('/auth/me'),
}

// ── Candidates API ─────────────────────────────────────────────────────────────
export const candidatesApi = {
  list: (params?: {
    page?: number; size?: number; status?: string; search?: string; department_id?: number
  }) => api.get<Paginated<Candidate>>('/candidates', { params }),
  get: (id: number) => api.get<Candidate>(`/candidates/${id}`),
  create: (data: CandidateCreate) => api.post<Candidate>('/candidates', data),
  update: (id: number, data: CandidateUpdate) => api.put<Candidate>(`/candidates/${id}`, data),
  delete: (id: number) => api.delete<APIResponse>(`/candidates/${id}`),
  uploadCv: (id: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<APIResponse>(`/candidates/${id}/upload-cv`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  uploadLetter: (id: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<APIResponse>(`/candidates/${id}/upload-letter`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// ── Departments API ────────────────────────────────────────────────────────────
export const departmentsApi = {
  list: (params?: { page?: number; size?: number; search?: string }) =>
    api.get<Paginated<Department>>('/departments', { params }),
  get: (id: number) => api.get<Department>(`/departments/${id}`),
  create: (data: DepartmentCreate) => api.post<Department>('/departments', data),
  update: (id: number, data: Partial<DepartmentCreate>) =>
    api.put<Department>(`/departments/${id}`, data),
  delete: (id: number) => api.delete<APIResponse>(`/departments/${id}`),
}

// ── Applications API ───────────────────────────────────────────────────────────
export const applicationsApi = {
  list: (params?: {
    page?: number; size?: number; status?: string;
    candidate_id?: number; department_id?: number
  }) => api.get<Paginated<Application>>('/applications', { params }),
  create: (data: ApplicationCreate) => api.post<Application>('/applications', data),
  updateStatus: (id: number, status: string, reviewer_id?: number) =>
    api.put<Application>(`/applications/${id}/status`, { status, reviewer_id }),
  delete: (id: number) => api.delete<APIResponse>(`/applications/${id}`),
}

// ── Analytics API ──────────────────────────────────────────────────────────────
export const analyticsApi = {
  dashboard: () => api.get<DashboardStats>('/analytics/dashboard'),
  activityTrend: () => api.get<ActivityTrend[]>('/analytics/activity-trend'),
  candidatesByStatus: () => api.get<CandidatesByStatus[]>('/analytics/candidates-by-status'),
  topSkills: (limit?: number) => api.get<TopSkill[]>('/analytics/top-skills', { params: { limit } }),
  departmentsCapacity: () => api.get<DepartmentCapacity[]>('/analytics/departments-capacity'),
}

// ── AI API ─────────────────────────────────────────────────────────────────────
export const aiApi = {
  analyzeCv: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/ai/analyze-cv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  extractSkills: (text: string) => api.post('/ai/extract-skills', { text }),
  recommendDepartment: (candidateId: number) =>
    api.post('/ai/recommend-department', { candidate_id: candidateId }),
  rankCandidates: (candidateIds: number[], departmentId: number) =>
    api.post('/ai/rank-candidates', { candidate_ids: candidateIds, department_id: departmentId }),
  runAnalysis: (candidateId: number) => api.post(`/ai/run-analysis/${candidateId}`),
  chat: (query: string, contextData?: string, candidateId?: number, departmentId?: number) =>
    api.post('/ai/assistant/chat', { query, context_data: contextData, candidate_id: candidateId, department_id: departmentId }),
  interviewQuestions: (candidateId: number, departmentId?: number) =>
    api.post('/ai/interview-questions', { candidate_id: candidateId, department_id: departmentId }),
  generateEmail: (candidateId: number, emailType: string, additionalNotes?: string) =>
    api.post('/ai/generate-email', { candidate_id: candidateId, email_type: emailType, additional_notes: additionalNotes }),
  compareCandidates: (candidateIds: number[], departmentId?: number) =>
    api.post('/ai/compare-candidates', { candidate_ids: candidateIds, department_id: departmentId }),
  analyzeMatch: (candidateId: number, departmentId: number) =>
    api.post('/ai/analyze-match', { candidate_id: candidateId, department_id: departmentId }),
}

// ── Settings API ───────────────────────────────────────────────────────────────
export const settingsApi = {
  list: () => api.get<any[]>('/settings'),
  update: (key: string, value: string) => api.put(`/settings/${key}`, { value }),
}

// ── Users API ──────────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => api.get<User[]>('/users'),
  create: (data: RegisterRequest) => api.post<User>('/users', data),
  delete: (id: number) => api.delete<APIResponse>(`/users/${id}`),
}

// ── Notifications API ──────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () => api.get<Notification[]>('/notifications/'),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
}

// ── Intake API ─────────────────────────────────────────────────────────────────
export const intakeApi = {
  importCsv: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ImportSummary>('/intake/csv', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
  },
}

// ── Audit Log API ──────────────────────────────────────────────────────────────
export const auditApi = {
  list: (skip = 0, limit = 100) =>
    api.get<AuditLogEntry[]>('/intake/audit-log', { params: { skip, limit } }),
}

export default api
