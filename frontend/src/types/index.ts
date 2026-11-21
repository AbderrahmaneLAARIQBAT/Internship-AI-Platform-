// ── User Types ─────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'hr' | 'manager'

export interface User {
  id: number
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
  avatar_url?: string
  created_at: string
  updated_at: string
}

// ── Auth Types ─────────────────────────────────────────────────────────────────
export interface Token {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  full_name: string
  email: string
  password: string
  role?: UserRole
}

// ── Candidate Types ────────────────────────────────────────────────────────────
export type CandidateStatus =
  | 'pending'
  | 'under_review'
  | 'shortlisted'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export type WorkflowStage =
  | 'new'
  | 'ai_processing'
  | 'ready_for_review'
  | 'hr_review'
  | 'manager_review'
  | 'interview'
  | 'accepted'
  | 'rejected'

export type IntakeSource = 'manual' | 'csv' | 'google_form' | 'api' | 'email'

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface SkillBrief {
  id: number
  name: string
  level: SkillLevel
}

export interface AltDepartment {
  department_id: number
  department_name: string
  score: number
}

export interface Candidate {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  linkedin_url?: string
  github_url?: string
  date_of_birth?: string
  university?: string
  degree?: string
  graduation_year?: number
  education_history?: any[]
  work_experience?: any[]
  certifications?: any[]
  cv_file?: string
  motivation_letter_file?: string
  // AI — basic
  ai_score: number
  ai_confidence: number
  // AI — rich
  ai_summary?: string
  ai_strengths?: string[]
  ai_weaknesses?: string[]
  ai_interview_questions?: string[]
  ai_matched_skills?: string[]
  ai_missing_skills?: string[]
  ai_explanation?: string
  ai_alt_departments?: AltDepartment[]
  ai_languages?: string[]
  ai_experience_years?: number
  // Workflow & intake
  workflow_stage: WorkflowStage
  intake_source: IntakeSource
  recommended_department_id?: number
  status: CandidateStatus
  notes?: string
  created_at: string
  updated_at: string
  skills?: SkillBrief[]
}

export interface CandidateCreate {
  first_name: string
  last_name: string
  email: string
  phone?: string
  university?: string
  degree?: string
  graduation_year?: number
  education_history?: any[]
  work_experience?: any[]
  certifications?: any[]
  notes?: string
  linkedin_url?: string
  github_url?: string
  skills?: string[]
}

export interface CandidateUpdate {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  university?: string
  degree?: string
  graduation_year?: number
  education_history?: any[]
  work_experience?: any[]
  certifications?: any[]
  status?: CandidateStatus
  workflow_stage?: WorkflowStage
  notes?: string
  linkedin_url?: string
  github_url?: string
  skills?: string[]
}

// ── Department Types ───────────────────────────────────────────────────────────
export interface DepartmentSkillBrief {
  id: number
  name: string
  importance: number
}

export interface Department {
  id: number
  name: string
  description?: string
  capacity: number
  current_count: number
  manager_id?: number
  created_at: string
  updated_at: string
  skills?: DepartmentSkillBrief[]
}

export interface DepartmentCreate {
  name: string
  description?: string
  capacity?: number
  manager_id?: number
}

// ── Application Types ──────────────────────────────────────────────────────────
export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export interface Application {
  id: number
  candidate_id: number
  department_id: number
  matching_score: number
  status: ApplicationStatus
  cover_message?: string
  reviewer_id?: number
  reviewed_at?: string
  created_at: string
  updated_at: string
  candidate?: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  department?: Pick<Department, 'id' | 'name'>
}

export interface ApplicationCreate {
  candidate_id: number
  department_id: number
  cover_message?: string
}

// ── Analytics Types ────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_candidates: number
  total_applications: number
  total_departments: number
  pending_applications: number
  accepted_applications: number
  rejected_applications: number
  avg_ai_score: number
  shortlisted_candidates: number
}

export interface CandidatesByStatus {
  status: string
  count: number
}

export interface ActivityTrend {
  month: string
  candidates: number
  applications: number
}

export interface TopSkill {
  skill_name: string
  candidate_count: number
}

export interface DepartmentCapacity {
  department_name: string
  capacity: number
  current_count: number
  fill_percentage: number
}

// ── Pagination ─────────────────────────────────────────────────────────────────
export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

// ── API Response ───────────────────────────────────────────────────────────────
export interface APIResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

// ── AI Types ───────────────────────────────────────────────────────────────────
export interface CVAnalysisResult {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  skills: string[]
  education?: string
  raw_text?: string
}

export interface DepartmentRanking {
  department_id: number
  department_name: string
  score: number
}

export interface RecommendationResult {
  recommended_department_id?: number
  recommended_department_name?: string
  score: number
  rankings: DepartmentRanking[]
}

// ── Notification Types ─────────────────────────────────────────────────────────
export interface Notification {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  is_read: boolean
  link?: string
  created_at?: string
}

// ── Audit Log Types ────────────────────────────────────────────────────────────
export interface AuditLogEntry {
  id: number
  action: string
  entity_type?: string
  entity_id?: number
  user_id?: number
  details?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

// ── Import Types ───────────────────────────────────────────────────────────────
export interface ImportError {
  row: number
  error: string
}

export interface ImportSummary {
  total: number
  imported: number
  skipped: number
  failed: number
  errors: ImportError[]
}
