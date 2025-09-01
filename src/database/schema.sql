-- HR Bot Database Schema
-- This script creates all the necessary tables for the HR Bot system

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vacancies table
CREATE TABLE IF NOT EXISTS vacancies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements JSONB NOT NULL,
    evaluation_weights JSONB NOT NULL DEFAULT '{"technicalSkills": 50, "communication": 30, "problemSolving": 20}',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_vacancies_status ON vacancies(status);
CREATE INDEX IF NOT EXISTS idx_vacancies_created_at ON vacancies(created_at);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,
    telegram_user_id BIGINT UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    username VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on telegram_user_id for faster lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidates_telegram_user_id ON candidates(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at);

-- Dialogues table
CREATE TABLE IF NOT EXISTS dialogues (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    vacancy_id INTEGER NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('text', 'audio', 'system')),
    content TEXT,
    audio_file_path VARCHAR(500),
    transcription TEXT,
    sender VARCHAR(50) NOT NULL CHECK (sender IN ('candidate', 'bot')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_dialogues_candidate_id ON dialogues(candidate_id);
CREATE INDEX IF NOT EXISTS idx_dialogues_vacancy_id ON dialogues(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_dialogues_created_at ON dialogues(created_at);
CREATE INDEX IF NOT EXISTS idx_dialogues_candidate_vacancy ON dialogues(candidate_id, vacancy_id);

-- Evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    vacancy_id INTEGER NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_evaluations_candidate_id ON evaluations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_vacancy_id ON evaluations(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_recommendation ON evaluations(recommendation);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_evaluations_candidate_vacancy ON evaluations(candidate_id, vacancy_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at for vacancies
CREATE TRIGGER update_vacancies_updated_at 
    BEFORE UPDATE ON vacancies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- This can be removed in production
INSERT INTO vacancies (title, description, requirements, evaluation_weights, status) VALUES 
(
    'Senior Full Stack Developer',
    'We are looking for an experienced Full Stack Developer to join our team. The ideal candidate should have strong experience in both frontend and backend technologies.',
    '{
        "technicalSkills": [
            {"name": "JavaScript", "level": "advanced", "mandatory": true, "weight": 9},
            {"name": "TypeScript", "level": "intermediate", "mandatory": true, "weight": 8},
            {"name": "React", "level": "advanced", "mandatory": true, "weight": 9},
            {"name": "Node.js", "level": "intermediate", "mandatory": true, "weight": 8},
            {"name": "PostgreSQL", "level": "intermediate", "mandatory": false, "weight": 6}
        ],
        "experience": [
            {"domain": "Web Development", "minimumYears": 5, "preferred": true},
            {"domain": "Full Stack Development", "minimumYears": 3, "preferred": true}
        ],
        "education": [
            {"level": "bachelor", "field": "Computer Science", "required": false}
        ],
        "softSkills": ["Problem Solving", "Team Collaboration", "Communication"]
    }',
    '{"technicalSkills": 60, "communication": 25, "problemSolving": 15}',
    'active'
),
(
    'Junior Frontend Developer',
    'Entry-level position for a Frontend Developer. Perfect for recent graduates or developers with 1-2 years of experience.',
    '{
        "technicalSkills": [
            {"name": "HTML", "level": "intermediate", "mandatory": true, "weight": 7},
            {"name": "CSS", "level": "intermediate", "mandatory": true, "weight": 7},
            {"name": "JavaScript", "level": "intermediate", "mandatory": true, "weight": 8},
            {"name": "React", "level": "beginner", "mandatory": false, "weight": 6}
        ],
        "experience": [
            {"domain": "Frontend Development", "minimumYears": 1, "preferred": false}
        ],
        "softSkills": ["Eagerness to Learn", "Attention to Detail", "Communication"]
    }',
    '{"technicalSkills": 50, "communication": 30, "problemSolving": 20}',
    'active'
) ON CONFLICT DO NOTHING;