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

-- Create candidates table (with CV upload support)
CREATE TABLE IF NOT EXISTS candidates (
  id SERIAL PRIMARY KEY,
  telegram_user_id BIGINT UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  username VARCHAR(255),
  cv_file_path VARCHAR(500),
  cv_file_name VARCHAR(255),
  cv_file_size INTEGER,
  cv_uploaded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dialogues table (with document support)
CREATE TABLE IF NOT EXISTS dialogues (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id INTEGER REFERENCES vacancies(id) ON DELETE CASCADE,
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('text', 'audio', 'system', 'document')),
  content TEXT NOT NULL,
  audio_file_path VARCHAR(500),
  transcription TEXT,
  document_file_path VARCHAR(500),
  document_file_name VARCHAR(255),
  document_file_size INTEGER,
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

-- Create interview_results table
CREATE TABLE IF NOT EXISTS interview_results (
  id SERIAL PRIMARY KEY,
  dialogue_id INTEGER REFERENCES dialogues(id) ON DELETE CASCADE,
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id INTEGER REFERENCES vacancies(id) ON DELETE CASCADE,
  evaluation_id INTEGER REFERENCES evaluations(id) ON DELETE SET NULL,
  interview_status VARCHAR(50) NOT NULL CHECK (interview_status IN ('completed', 'in_progress', 'cancelled')),
  total_questions INTEGER DEFAULT 0,
  total_answers INTEGER DEFAULT 0,
  interview_duration_minutes INTEGER,
  completion_percentage INTEGER CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  final_feedback TEXT,
  interviewer_notes TEXT,
  candidate_satisfaction_rating INTEGER CHECK (candidate_satisfaction_rating >= 1 AND candidate_satisfaction_rating <= 5),
  technical_assessment_score INTEGER CHECK (technical_assessment_score >= 0 AND technical_assessment_score <= 100),
  soft_skills_assessment_score INTEGER CHECK (soft_skills_assessment_score >= 0 AND soft_skills_assessment_score <= 100),
  overall_impression TEXT,
  next_steps TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMP,
  result_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(candidate_id, vacancy_id)
);

-- Create prompt_settings table
CREATE TABLE IF NOT EXISTS prompt_settings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  value_type VARCHAR(50) NOT NULL DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

CREATE INDEX IF NOT EXISTS idx_interview_results_candidate_vacancy
ON interview_results(candidate_id, vacancy_id);

CREATE INDEX IF NOT EXISTS idx_interview_results_status
ON interview_results(interview_status);

CREATE INDEX IF NOT EXISTS idx_interview_results_created_at
ON interview_results(created_at);

CREATE INDEX IF NOT EXISTS idx_prompt_settings_name
ON prompt_settings(name);

CREATE INDEX IF NOT EXISTS idx_prompt_settings_category
ON prompt_settings(category);

CREATE INDEX IF NOT EXISTS idx_system_settings_key
ON system_settings(key);

CREATE INDEX IF NOT EXISTS idx_system_settings_category
ON system_settings(category);

CREATE INDEX IF NOT EXISTS idx_vacancies_status
ON vacancies(status);

-- Create JSONB indexes for better performance on vacancy requirements
CREATE INDEX IF NOT EXISTS idx_vacancies_technical_skills 
ON vacancies USING GIN ((requirements -> 'technicalSkills'));

CREATE INDEX IF NOT EXISTS idx_vacancies_experience 
ON vacancies USING GIN ((requirements -> 'experience'));

CREATE INDEX IF NOT EXISTS idx_vacancies_soft_skills 
ON vacancies USING GIN ((requirements -> 'softSkills'));

-- Create validation functions for enhanced requirements validation
CREATE OR REPLACE FUNCTION validate_technical_skills(skills JSONB) 
RETURNS BOOLEAN 
LANGUAGE plpgsql
AS $validate_technical_skills$
BEGIN
  -- If skills is null or empty array, it's valid
  IF skills IS NULL OR jsonb_array_length(skills) = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Check each skill has required fields
  FOR i IN 0..jsonb_array_length(skills) - 1 LOOP
    -- Check required fields exist
    IF NOT (skills -> i ? 'name' AND 
            skills -> i ? 'level' AND 
            skills -> i ? 'mandatory' AND 
            skills -> i ? 'weight') THEN
      RETURN FALSE;
    END IF;
    
    -- Check level is valid
    IF NOT (skills -> i ->> 'level' IN ('beginner', 'intermediate', 'advanced', 'expert')) THEN
      RETURN FALSE;
    END IF;
    
    -- Check weight is valid (1-10)
    IF NOT ((skills -> i ->> 'weight')::INTEGER BETWEEN 1 AND 10) THEN
      RETURN FALSE;
    END IF;
    
    -- Check mandatory is boolean
    IF NOT (skills -> i ->> 'mandatory' IN ('true', 'false')) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$validate_technical_skills$;

CREATE OR REPLACE FUNCTION validate_experience_requirements(experience JSONB) 
RETURNS BOOLEAN 
LANGUAGE plpgsql
AS $validate_experience_requirements$
BEGIN
  -- If experience is null or empty array, it's valid
  IF experience IS NULL OR jsonb_array_length(experience) = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Check each experience requirement has required fields
  FOR i IN 0..jsonb_array_length(experience) - 1 LOOP
    -- Check required fields exist
    IF NOT (experience -> i ? 'domain' AND 
            experience -> i ? 'minimumYears' AND 
            experience -> i ? 'preferred') THEN
      RETURN FALSE;
    END IF;
    
    -- Check minimumYears is valid (0-50)
    IF NOT ((experience -> i ->> 'minimumYears')::INTEGER BETWEEN 0 AND 50) THEN
      RETURN FALSE;
    END IF;
    
    -- Check preferred is boolean
    IF NOT (experience -> i ->> 'preferred' IN ('true', 'false')) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$validate_experience_requirements$;

CREATE OR REPLACE FUNCTION validate_evaluation_weights(weights JSONB) 
RETURNS BOOLEAN 
LANGUAGE plpgsql
AS $validate_evaluation_weights$
BEGIN
  -- Check required fields exist
  IF NOT (weights ? 'technicalSkills' AND 
          weights ? 'communication' AND 
          weights ? 'problemSolving') THEN
    RETURN FALSE;
  END IF;
  
  -- Check all weights are valid percentages (0-100)
  IF NOT ((weights ->> 'technicalSkills')::INTEGER BETWEEN 0 AND 100 AND
          (weights ->> 'communication')::INTEGER BETWEEN 0 AND 100 AND
          (weights ->> 'problemSolving')::INTEGER BETWEEN 0 AND 100) THEN
    RETURN FALSE;
  END IF;
  
  -- Check weights sum to 100
  IF ((weights ->> 'technicalSkills')::INTEGER + 
      (weights ->> 'communication')::INTEGER + 
      (weights ->> 'problemSolving')::INTEGER) != 100 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$validate_evaluation_weights$;

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

DROP TRIGGER IF EXISTS update_interview_results_updated_at ON interview_results;
CREATE TRIGGER update_interview_results_updated_at
BEFORE UPDATE ON interview_results
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prompt_settings_updated_at ON prompt_settings;
CREATE TRIGGER update_prompt_settings_updated_at
BEFORE UPDATE ON prompt_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON system_settings
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

-- Insert default prompt settings
INSERT INTO prompt_settings (name, description, prompt_template, category) VALUES
(
  'cv_analysis',
  'Prompt for analyzing uploaded CV/resume files',
  'Ты — HR-ассистент, анализирующий загруженное резюме кандидата.

{{vacancy_context}}

Файл резюме: {{file_name}}
Содержимое резюме: {{file_content}}

Твоя задача:
1. Проанализируй резюме в контексте конкретной вакансии
2. Извлеки ключевые навыки, опыт работы и образование
3. Оцени соответствие требованиям вакансии
4. Определи сильные стороны и пробелы
5. Задай первый уместный вопрос для углубленного интервью

ВАЖНО: Верни ответ строго ТОЛЬКО в JSON формате с полями:
{
  "analysis": "краткий анализ резюме и соответствия вакансии",
  "strengths": "выявленные сильные стороны кандидата",
  "gaps": "обнаруженные пробелы или области для уточнения",
  "first_question": "первый вопрос для интервью на основе анализа резюме"
}',
  'cv_analysis'
),
(
  'resume_analysis',
  'Prompt for analyzing resume text provided in chat',
  'Ты — HR-ассистент.
У тебя есть описание вакансии и резюме кандидата.
1. Извлеки ключевые требования из вакансии.
2. Извлеки ключевые навыки из резюме.
3. Определи совпадения и пробелы.
4. Сгенерируй 5 вопросов для интервью (technical, case study, soft skills).
5. Ответ кандидата приходит из системы распознавания речи, вероятно, содержит ошибки учитывай это при анализе
Верни ответ в JSON с ключами: job_requirements, candidate_skills, matches, gaps, questions.
---
Вакансия:
{{job_description}}

Резюме:
{{resume}}',
  'resume_analysis'
),
(
  'interview_chat',
  'Prompt for conducting interview conversations with candidates',
  'Ты — HR-ассистент, проводящий интервью с кандидатом.

{{vacancy_context}}

Контекст разговора:
{{conversation_context}}

Номер вопроса: {{question_count}}

Твоя задача:
1. Проанализируй ответ кандидата в контексте конкретной вакансии
2. Оцени соответствие требованиям вакансии
3. Задай следующий уместный вопрос или дай обратную связь (не повторяйся)
4. Будь дружелюбным, но профессиональным
5. На 5-м вопросе вежливо попрощайся и дай финальную обратную связь
6. Если это уже 6+ вопрос, вежливо отвечай что интервью закончилось

ВАЖНО: Верни ответ строго ТОЛЬКО в JSON формате с двумя полями:
{
  "feedback": "конструктивная обратная связь для кандидата",
  "next_question": "следующий вопрос для кандидата или пустая строка если интервью закончено"
}

Ответ кандидата: {{candidate_message}}',
  'interview'
)
ON CONFLICT (name) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (key, value, description, category, value_type) VALUES
('llm_provider', 'ollama', 'Current LLM provider (ollama or perplexity)', 'llm', 'string'),
('ollama_base_url', 'http://localhost:11434', 'Ollama API base URL', 'llm', 'string'),
('ollama_model', 'gemma3n:latest', 'Ollama model to use', 'llm', 'string'),
('perplexity_api_key', '', 'Perplexity API key', 'llm', 'string'),
('perplexity_model', 'llama-3.1-sonar-small-128k-online', 'Perplexity model to use', 'llm', 'string')
ON CONFLICT (key) DO NOTHING;

-- Add comments for documentation
COMMENT ON FUNCTION validate_technical_skills(JSONB) IS 'Validates technical skills array structure in vacancy requirements';
COMMENT ON FUNCTION validate_experience_requirements(JSONB) IS 'Validates experience requirements array structure in vacancy requirements';
COMMENT ON FUNCTION validate_evaluation_weights(JSONB) IS 'Validates evaluation weights structure and ensures they sum to 100%';
