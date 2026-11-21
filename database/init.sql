-- ============================================================
-- intern_ai_platform - PostgreSQL Schema Initialization
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'hr', 'manager');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE candidate_status AS ENUM ('pending', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE workflow_stage AS ENUM ('new', 'ai_processing', 'ready_for_review', 'hr_review', 'manager_review', 'interview', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE intake_source AS ENUM ('manual', 'csv', 'google_form', 'api', 'email');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('pending', 'under_review', 'accepted', 'rejected', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE skill_category AS ENUM ('programming', 'framework', 'database', 'devops', 'soft_skill', 'language', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLE: users
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id                  SERIAL PRIMARY KEY,
    full_name           VARCHAR(255) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(512) NOT NULL,
    role                user_role NOT NULL DEFAULT 'hr',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    avatar_url          VARCHAR(512),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- TABLE: departments
-- ============================================================

CREATE TABLE IF NOT EXISTS departments (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL UNIQUE,
    description     TEXT,
    capacity        INTEGER NOT NULL DEFAULT 5,
    current_count   INTEGER NOT NULL DEFAULT 0,
    manager_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

-- ============================================================
-- TABLE: skills
-- ============================================================

CREATE TABLE IF NOT EXISTS skills (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    category    skill_category NOT NULL DEFAULT 'other',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_name_trgm ON skills USING GIN (name gin_trgm_ops);

-- ============================================================
-- TABLE: candidates
-- ============================================================

CREATE TABLE IF NOT EXISTS candidates (
    id                          SERIAL PRIMARY KEY,
    -- Identity
    first_name                  VARCHAR(100) NOT NULL,
    last_name                   VARCHAR(100) NOT NULL,
    email                       VARCHAR(255) NOT NULL UNIQUE,
    phone                       VARCHAR(50),
    -- Education & profile
    university                  VARCHAR(255),
    degree                      VARCHAR(255),
    graduation_year             INTEGER,
    -- Documents
    cv_file                     VARCHAR(512),
    motivation_letter_file      VARCHAR(512),
    -- AI analysis — basic
    ai_score                    FLOAT DEFAULT 0.0,
    ai_confidence               FLOAT DEFAULT 0.0,
    -- AI analysis — rich
    ai_summary                  TEXT,
    ai_strengths                JSONB,
    ai_weaknesses               JSONB,
    ai_interview_questions      JSONB,
    ai_matched_skills           JSONB,
    ai_missing_skills           JSONB,
    ai_explanation              TEXT,
    ai_alt_departments          JSONB,
    ai_languages                JSONB,
    ai_experience_years         INTEGER,
    -- Workflow & intake
    workflow_stage              workflow_stage NOT NULL DEFAULT 'new',
    intake_source               intake_source NOT NULL DEFAULT 'manual',
    recommended_department_id   INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    status                      candidate_status NOT NULL DEFAULT 'pending',
    notes                       TEXT,
    linkedin_url                VARCHAR(512),
    github_url                  VARCHAR(512),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_workflow ON candidates(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_candidates_ai_score ON candidates(ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_recommended_dept ON candidates(recommended_department_id);

-- ============================================================
-- TABLE: candidate_skills
-- ============================================================

CREATE TABLE IF NOT EXISTS candidate_skills (
    candidate_id    INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    skill_id        INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    level           skill_level NOT NULL DEFAULT 'beginner',
    PRIMARY KEY (candidate_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_candidate_skills_candidate ON candidate_skills(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_skills_skill ON candidate_skills(skill_id);

-- ============================================================
-- TABLE: department_skills
-- ============================================================

CREATE TABLE IF NOT EXISTS department_skills (
    department_id   INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    skill_id        INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    importance      FLOAT NOT NULL DEFAULT 1.0 CHECK (importance BETWEEN 0.0 AND 1.0),
    PRIMARY KEY (department_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_department_skills_dept ON department_skills(department_id);

-- ============================================================
-- TABLE: applications
-- ============================================================

CREATE TABLE IF NOT EXISTS applications (
    id              SERIAL PRIMARY KEY,
    candidate_id    INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    department_id   INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    matching_score  FLOAT DEFAULT 0.0,
    status          application_status NOT NULL DEFAULT 'pending',
    cover_message   TEXT,
    reviewer_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (candidate_id, department_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_department ON applications(department_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_score ON applications(matching_score DESC);

-- ============================================================
-- TABLE: audit_logs
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(50),
    entity_id       INTEGER,
    details         JSONB,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLE: system_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT,
    description VARCHAR(512),
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
