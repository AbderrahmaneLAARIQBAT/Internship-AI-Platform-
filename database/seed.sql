-- ============================================================
-- intern_ai_platform - Seed Data
-- Passwords are all: "Password123!" (bcrypt hashed)
-- ============================================================

-- ============================================================
-- USERS
-- ============================================================

INSERT INTO users (full_name, email, password_hash, role, is_active) VALUES
(
    'Admin System',
    'admin@company.com',
    '$2b$12$bmEbqfHG.iLW7rOhxQnkLuW9Uhk2b/OYX8hbl.F7b37To8GPpl1Dy',
    'admin',
    TRUE
),
(
    'Sarah Benali',
    'hr@company.com',
    '$2b$12$bmEbqfHG.iLW7rOhxQnkLuW9Uhk2b/OYX8hbl.F7b37To8GPpl1Dy',
    'hr',
    TRUE
),
(
    'Karim Mansouri',
    'manager@company.com',
    '$2b$12$bmEbqfHG.iLW7rOhxQnkLuW9Uhk2b/OYX8hbl.F7b37To8GPpl1Dy',
    'manager',
    TRUE
),
(
    'Ahmed Tazi',
    'student@company.com',
    '$2b$12$bmEbqfHG.iLW7rOhxQnkLuW9Uhk2b/OYX8hbl.F7b37To8GPpl1Dy',
    'student',
    TRUE
),
(
    'Fatima Zohra',
    'fatima@student.com',
    '$2b$12$bmEbqfHG.iLW7rOhxQnkLuW9Uhk2b/OYX8hbl.F7b37To8GPpl1Dy',
    'student',
    TRUE
),
(
    'Youssef El Idrissi',
    'youssef@student.com',
    '$2b$12$bmEbqfHG.iLW7rOhxQnkLuW9Uhk2b/OYX8hbl.F7b37To8GPpl1Dy',
    'student',
    TRUE
),
(
    'Nour El Houda',
    'nour@student.com',
    '$2b$12$bmEbqfHG.iLW7rOhxQnkLuW9Uhk2b/OYX8hbl.F7b37To8GPpl1Dy',
    'student',
    TRUE
),
(
    'Omar Bennis',
    'omar@student.com',
    '$2b$12$bmEbqfHG.iLW7rOhxQnkLuW9Uhk2b/OYX8hbl.F7b37To8GPpl1Dy',
    'student',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- DEPARTMENTS
-- ============================================================

INSERT INTO departments (name, description, capacity, current_count, manager_id) VALUES
(
    'Software Development',
    'Full-stack web and mobile application development using modern frameworks and agile methodologies.',
    8, 3,
    (SELECT id FROM users WHERE email = 'manager@company.com')
),
(
    'Data Science & AI',
    'Machine learning, deep learning, NLP and data analytics projects with Python and cutting-edge AI tools.',
    6, 2,
    (SELECT id FROM users WHERE email = 'manager@company.com')
),
(
    'Network & Infrastructure',
    'Network design, cloud infrastructure (AWS/Azure), Kubernetes, and CI/CD pipeline management.',
    5, 1,
    (SELECT id FROM users WHERE email = 'manager@company.com')
),
(
    'Cybersecurity',
    'Penetration testing, security audits, SIEM management, and security awareness training.',
    4, 1,
    (SELECT id FROM users WHERE email = 'manager@company.com')
),
(
    'Business Intelligence',
    'Data warehousing, ETL pipelines, Power BI dashboards, and strategic reporting.',
    5, 0,
    (SELECT id FROM users WHERE email = 'manager@company.com')
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SKILLS
-- ============================================================

INSERT INTO skills (name, category) VALUES
('Python', 'programming'),
('JavaScript', 'programming'),
('TypeScript', 'programming'),
('Java', 'programming'),
('C++', 'programming'),
('Go', 'programming'),
('Rust', 'programming'),
('SQL', 'database'),
('FastAPI', 'framework'),
('Django', 'framework'),
('Flask', 'framework'),
('React', 'framework'),
('Node.js', 'framework'),
('Vue.js', 'framework'),
('PostgreSQL', 'database'),
('MySQL', 'database'),
('MongoDB', 'database'),
('Redis', 'database'),
('Docker', 'devops'),
('Kubernetes', 'devops'),
('Git', 'devops'),
('Linux', 'devops'),
('AWS', 'devops'),
('Azure', 'devops'),
('CI/CD', 'devops'),
('Machine Learning', 'other'),
('Deep Learning', 'other'),
('NLP', 'other'),
('REST API', 'other'),
('GraphQL', 'other'),
('TensorFlow', 'framework'),
('PyTorch', 'framework'),
('scikit-learn', 'framework'),
('Pandas', 'framework'),
('NumPy', 'framework'),
('Tableau', 'other'),
('Power BI', 'other'),
('Cybersecurity', 'other'),
('Network Administration', 'other'),
('Agile/Scrum', 'soft_skill'),
('English', 'language'),
('French', 'language'),
('Arabic', 'language')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- CANDIDATES
-- ============================================================

INSERT INTO candidates (user_id, phone, university, degree, graduation_year, ai_score, status, recommended_department_id, linkedin_url, github_url)
VALUES
(
    (SELECT id FROM users WHERE email = 'student@company.com'),
    '+212600112233',
    'École Mohammadia d''Ingénieurs (EMI)',
    'Master Software Engineering',
    2025,
    87.5,
    'shortlisted',
    (SELECT id FROM departments WHERE name = 'Software Development'),
    'https://linkedin.com/in/ahmed-tazi',
    'https://github.com/ahmed-tazi'
),
(
    (SELECT id FROM users WHERE email = 'fatima@student.com'),
    '+212611223344',
    'ENSIAS Rabat',
    'Master Data Science',
    2025,
    92.0,
    'accepted',
    (SELECT id FROM departments WHERE name = 'Data Science & AI'),
    'https://linkedin.com/in/fatima-zohra',
    'https://github.com/fatima-zohra'
),
(
    (SELECT id FROM users WHERE email = 'youssef@student.com'),
    '+212622334455',
    'ENSA Casablanca',
    'Bachelor Network Engineering',
    2025,
    74.0,
    'under_review',
    (SELECT id FROM departments WHERE name = 'Network & Infrastructure'),
    NULL,
    'https://github.com/youssef-idrissi'
),
(
    (SELECT id FROM users WHERE email = 'nour@student.com'),
    '+212633445566',
    'Université Hassan II',
    'Master Cybersecurity',
    2025,
    81.0,
    'pending',
    (SELECT id FROM departments WHERE name = 'Cybersecurity'),
    'https://linkedin.com/in/nour-elhouda',
    NULL
),
(
    (SELECT id FROM users WHERE email = 'omar@student.com'),
    '+212644556677',
    'ISCAE Casablanca',
    'Bachelor Business Intelligence',
    2025,
    68.5,
    'pending',
    (SELECT id FROM departments WHERE name = 'Business Intelligence'),
    NULL,
    NULL
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- CANDIDATE SKILLS
-- ============================================================

-- Ahmed Tazi skills
INSERT INTO candidate_skills (candidate_id, skill_id, level)
SELECT c.id, s.id, 'advanced'
FROM candidates c, skills s
WHERE c.user_id = (SELECT id FROM users WHERE email = 'student@company.com')
AND s.name IN ('Python', 'React', 'TypeScript', 'FastAPI', 'PostgreSQL', 'Docker', 'Git')
ON CONFLICT DO NOTHING;

INSERT INTO candidate_skills (candidate_id, skill_id, level)
SELECT c.id, s.id, 'intermediate'
FROM candidates c, skills s
WHERE c.user_id = (SELECT id FROM users WHERE email = 'student@company.com')
AND s.name IN ('REST API', 'Linux', 'SQL')
ON CONFLICT DO NOTHING;

-- Fatima Zohra skills
INSERT INTO candidate_skills (candidate_id, skill_id, level)
SELECT c.id, s.id, 'expert'
FROM candidates c, skills s
WHERE c.user_id = (SELECT id FROM users WHERE email = 'fatima@student.com')
AND s.name IN ('Python', 'Machine Learning', 'Deep Learning', 'NLP', 'TensorFlow', 'scikit-learn')
ON CONFLICT DO NOTHING;

INSERT INTO candidate_skills (candidate_id, skill_id, level)
SELECT c.id, s.id, 'advanced'
FROM candidates c, skills s
WHERE c.user_id = (SELECT id FROM users WHERE email = 'fatima@student.com')
AND s.name IN ('Pandas', 'NumPy', 'SQL', 'Docker')
ON CONFLICT DO NOTHING;

-- Youssef skills
INSERT INTO candidate_skills (candidate_id, skill_id, level)
SELECT c.id, s.id, 'advanced'
FROM candidates c, skills s
WHERE c.user_id = (SELECT id FROM users WHERE email = 'youssef@student.com')
AND s.name IN ('Network Administration', 'Linux', 'AWS', 'Docker', 'Kubernetes')
ON CONFLICT DO NOTHING;

INSERT INTO candidate_skills (candidate_id, skill_id, level)
SELECT c.id, s.id, 'intermediate'
FROM candidates c, skills s
WHERE c.user_id = (SELECT id FROM users WHERE email = 'youssef@student.com')
AND s.name IN ('Python', 'CI/CD', 'Git')
ON CONFLICT DO NOTHING;

-- Nour skills
INSERT INTO candidate_skills (candidate_id, skill_id, level)
SELECT c.id, s.id, 'advanced'
FROM candidates c, skills s
WHERE c.user_id = (SELECT id FROM users WHERE email = 'nour@student.com')
AND s.name IN ('Cybersecurity', 'Linux', 'Python', 'Network Administration')
ON CONFLICT DO NOTHING;

-- Omar skills
INSERT INTO candidate_skills (candidate_id, skill_id, level)
SELECT c.id, s.id, 'advanced'
FROM candidates c, skills s
WHERE c.user_id = (SELECT id FROM users WHERE email = 'omar@student.com')
AND s.name IN ('Power BI', 'Tableau', 'SQL', 'SQL')
ON CONFLICT DO NOTHING;

INSERT INTO candidate_skills (candidate_id, skill_id, level)
SELECT c.id, s.id, 'intermediate'
FROM candidates c, skills s
WHERE c.user_id = (SELECT id FROM users WHERE email = 'omar@student.com')
AND s.name IN ('Python', 'MongoDB')
ON CONFLICT DO NOTHING;

-- ============================================================
-- DEPARTMENT SKILLS (requirements)
-- ============================================================

-- Software Development
INSERT INTO department_skills (department_id, skill_id, importance)
SELECT d.id, s.id, 0.9
FROM departments d, skills s
WHERE d.name = 'Software Development'
AND s.name IN ('Python', 'React', 'TypeScript', 'FastAPI', 'PostgreSQL', 'Docker', 'Git')
ON CONFLICT DO NOTHING;

INSERT INTO department_skills (department_id, skill_id, importance)
SELECT d.id, s.id, 0.6
FROM departments d, skills s
WHERE d.name = 'Software Development'
AND s.name IN ('REST API', 'Linux', 'SQL', 'JavaScript')
ON CONFLICT DO NOTHING;

-- Data Science
INSERT INTO department_skills (department_id, skill_id, importance)
SELECT d.id, s.id, 0.95
FROM departments d, skills s
WHERE d.name = 'Data Science & AI'
AND s.name IN ('Python', 'Machine Learning', 'Deep Learning', 'scikit-learn', 'TensorFlow')
ON CONFLICT DO NOTHING;

INSERT INTO department_skills (department_id, skill_id, importance)
SELECT d.id, s.id, 0.7
FROM departments d, skills s
WHERE d.name = 'Data Science & AI'
AND s.name IN ('Pandas', 'NumPy', 'SQL', 'NLP')
ON CONFLICT DO NOTHING;

-- Network & Infrastructure
INSERT INTO department_skills (department_id, skill_id, importance)
SELECT d.id, s.id, 0.9
FROM departments d, skills s
WHERE d.name = 'Network & Infrastructure'
AND s.name IN ('Network Administration', 'Linux', 'AWS', 'Docker', 'Kubernetes', 'CI/CD')
ON CONFLICT DO NOTHING;

-- Cybersecurity
INSERT INTO department_skills (department_id, skill_id, importance)
SELECT d.id, s.id, 0.9
FROM departments d, skills s
WHERE d.name = 'Cybersecurity'
AND s.name IN ('Cybersecurity', 'Linux', 'Python', 'Network Administration')
ON CONFLICT DO NOTHING;

-- Business Intelligence
INSERT INTO department_skills (department_id, skill_id, importance)
SELECT d.id, s.id, 0.9
FROM departments d, skills s
WHERE d.name = 'Business Intelligence'
AND s.name IN ('Power BI', 'Tableau', 'SQL')
ON CONFLICT DO NOTHING;

INSERT INTO department_skills (department_id, skill_id, importance)
SELECT d.id, s.id, 0.6
FROM departments d, skills s
WHERE d.name = 'Business Intelligence'
AND s.name IN ('Python', 'MongoDB', 'PostgreSQL')
ON CONFLICT DO NOTHING;

-- ============================================================
-- APPLICATIONS
-- ============================================================

INSERT INTO applications (candidate_id, department_id, matching_score, status, cover_message)
SELECT
    c.id,
    d.id,
    87.5,
    'under_review',
    'I am highly motivated to join the Software Development team and contribute to your innovative projects.'
FROM candidates c, departments d
WHERE c.user_id = (SELECT id FROM users WHERE email = 'student@company.com')
AND d.name = 'Software Development'
ON CONFLICT DO NOTHING;

INSERT INTO applications (candidate_id, department_id, matching_score, status, cover_message)
SELECT
    c.id,
    d.id,
    92.0,
    'accepted',
    'My expertise in machine learning and NLP aligns perfectly with your Data Science team goals.'
FROM candidates c, departments d
WHERE c.user_id = (SELECT id FROM users WHERE email = 'fatima@student.com')
AND d.name = 'Data Science & AI'
ON CONFLICT DO NOTHING;

INSERT INTO applications (candidate_id, department_id, matching_score, status, cover_message)
SELECT
    c.id,
    d.id,
    74.0,
    'pending',
    'I have solid experience in network administration and cloud infrastructure.'
FROM candidates c, departments d
WHERE c.user_id = (SELECT id FROM users WHERE email = 'youssef@student.com')
AND d.name = 'Network & Infrastructure'
ON CONFLICT DO NOTHING;

INSERT INTO applications (candidate_id, department_id, matching_score, status, cover_message)
SELECT
    c.id,
    d.id,
    81.0,
    'pending',
    'Cybersecurity is my passion and I want to apply my skills to protect your infrastructure.'
FROM candidates c, departments d
WHERE c.user_id = (SELECT id FROM users WHERE email = 'nour@student.com')
AND d.name = 'Cybersecurity'
ON CONFLICT DO NOTHING;

INSERT INTO applications (candidate_id, department_id, matching_score, status, cover_message)
SELECT
    c.id,
    d.id,
    68.5,
    'pending',
    'I am eager to develop business intelligence dashboards and support data-driven decisions.'
FROM candidates c, departments d
WHERE c.user_id = (SELECT id FROM users WHERE email = 'omar@student.com')
AND d.name = 'Business Intelligence'
ON CONFLICT DO NOTHING;
