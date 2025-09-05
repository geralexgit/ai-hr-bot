-- AI HR Bot Database Initialization Script
-- This script creates the database schema for the AI HR Bot system

-- Create database and user (if running as superuser)
-- Note: In Docker, this is handled by environment variables

-- Create vacancies table
CREATE TABLE IF NOT EXISTS vacancies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB NOT NULL,
  evaluation_weights JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id SERIAL PRIMARY KEY,
  telegram_user_id BIGINT UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  username VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dialogues table
CREATE TABLE IF NOT EXISTS dialogues (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id INTEGER REFERENCES vacancies(id) ON DELETE CASCADE,
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('text', 'audio', 'system')),
  content TEXT NOT NULL,
  audio_file_path VARCHAR(500),
  transcription TEXT,
  sender VARCHAR(50) NOT NULL CHECK (sender IN ('candidate', 'bot')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id INTEGER REFERENCES vacancies(id) ON DELETE CASCADE,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
  communication_score INTEGER CHECK (communication_score >= 0 AND communication_score <= 100),
  problem_solving_score INTEGER CHECK (problem_solving_score >= 0 AND problem_solving_score <= 100),
  strengths TEXT[],
  gaps TEXT[],
  contradictions TEXT[],
  recommendation VARCHAR(50) CHECK (recommendation IN ('proceed', 'reject', 'clarify')),
  feedback TEXT,
  analysis_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(candidate_id, vacancy_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_telegram_user_id
ON candidates(telegram_user_id);

CREATE INDEX IF NOT EXISTS idx_dialogues_candidate_vacancy
ON dialogues(candidate_id, vacancy_id);

CREATE INDEX IF NOT EXISTS idx_dialogues_created_at
ON dialogues(created_at);

CREATE INDEX IF NOT EXISTS idx_evaluations_candidate_vacancy
ON evaluations(candidate_id, vacancy_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_recommendation
ON evaluations(recommendation);

CREATE INDEX IF NOT EXISTS idx_vacancies_status
ON vacancies(status);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
DROP TRIGGER IF EXISTS update_vacancies_updated_at ON vacancies;
CREATE TRIGGER update_vacancies_updated_at
BEFORE UPDATE ON vacancies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates;
CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON candidates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dialogues_updated_at ON dialogues;
CREATE TRIGGER update_dialogues_updated_at
BEFORE UPDATE ON dialogues
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_evaluations_updated_at ON evaluations;
CREATE TRIGGER update_evaluations_updated_at
BEFORE UPDATE ON evaluations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample vacancy data for testing
INSERT INTO vacancies (title, description, requirements, evaluation_weights) VALUES 
(
  'Senior Python Developer',
  'We are looking for an experienced Python developer to join our team.',
  '{
    "technical_skills": ["Python", "Django", "PostgreSQL", "REST APIs"],
    "experience_years": 5,
    "soft_skills": ["Communication", "Problem Solving", "Team Collaboration"],
    "education": "Bachelor in Computer Science or equivalent experience"
  }',
  '{
    "technical_skills": 50,
    "communication": 30,
    "problem_solving": 20
  }'
)
ON CONFLICT DO NOTHING;

INSERT INTO vacancies (title, description, requirements, evaluation_weights) VALUES 
(
  'Frontend React Developer',
  'Join our frontend team to build modern web applications using React.',
  '{
    "technical_skills": ["React", "JavaScript", "TypeScript", "CSS", "HTML"],
    "experience_years": 3,
    "soft_skills": ["Creativity", "Attention to Detail", "User Experience Focus"],
    "education": "Bachelor in Computer Science, Design, or equivalent experience"
  }',
  '{
    "technical_skills": 60,
    "communication": 25,
    "problem_solving": 15
  }'
)
ON CONFLICT DO NOTHING;
