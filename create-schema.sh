#!/bin/bash

# AI HR Bot Database Schema Creation Script
# This script creates only the database schema (tables, indexes, triggers, and default data)
# Use this if you already have a database and user set up

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if .env file exists and load database configuration
if [ ! -f .env ]; then
    print_error ".env file not found. Please run ./setup-database.sh first or create .env file manually."
    exit 1
fi

# Load environment variables from .env file
source .env

# Validate required environment variables
if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    print_error "Missing required database configuration in .env file."
    print_info "Required variables: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
    exit 1
fi

print_info "🚀 AI HR Bot Database Schema Creation"
echo "======================================"
echo
print_info "Database Configuration:"
echo "  • Host: $DB_HOST"
echo "  • Port: $DB_PORT" 
echo "  • Database: $DB_NAME"
echo "  • User: $DB_USER"
echo

# Function to create database schema
create_database_schema() {
    print_info "Creating database tables and schema..."
    
    # Set password for psql
    export PGPASSWORD="$DB_PASSWORD"
    
    # Test connection first
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
        print_error "Cannot connect to database. Please check your configuration."
        unset PGPASSWORD
        exit 1
    fi
    
    print_success "Database connection successful"
    
    # Create tables using SQL commands
    print_info "Creating database schema..."
    
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

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
  cv_file_path VARCHAR(500),
  cv_file_name VARCHAR(255),
  cv_file_size INTEGER,
  cv_uploaded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dialogues table
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
CREATE INDEX IF NOT EXISTS idx_candidates_telegram_user_id ON candidates(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_dialogues_candidate_vacancy ON dialogues(candidate_id, vacancy_id);
CREATE INDEX IF NOT EXISTS idx_dialogues_created_at ON dialogues(created_at);
CREATE INDEX IF NOT EXISTS idx_evaluations_candidate_vacancy ON evaluations(candidate_id, vacancy_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_recommendation ON evaluations(recommendation);
CREATE INDEX IF NOT EXISTS idx_interview_results_candidate_vacancy ON interview_results(candidate_id, vacancy_id);
CREATE INDEX IF NOT EXISTS idx_interview_results_status ON interview_results(interview_status);
CREATE INDEX IF NOT EXISTS idx_interview_results_created_at ON interview_results(created_at);
CREATE INDEX IF NOT EXISTS idx_vacancies_status ON vacancies(status);
CREATE INDEX IF NOT EXISTS idx_prompt_settings_name ON prompt_settings(name);
CREATE INDEX IF NOT EXISTS idx_prompt_settings_category ON prompt_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- Create triggers for automatic timestamp updates
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
6. Если это уже 6+ вопрос, вежливо отвечай что интервью закончено

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
EOF

    if [ $? -eq 0 ]; then
        print_success "Database schema created successfully"
    else
        print_error "Failed to create database schema"
        unset PGPASSWORD
        exit 1
    fi
    
    # Clear the password from environment
    unset PGPASSWORD
}

# Function to verify schema creation
verify_schema() {
    print_info "Verifying database schema..."
    export PGPASSWORD="$DB_PASSWORD"
    
    # Check if all required tables exist
    tables_query="SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    existing_tables=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$tables_query" | tr -d ' ')
    
    required_tables=("candidates" "dialogues" "evaluations" "interview_results" "prompt_settings" "system_settings" "vacancies")
    
    print_info "Existing tables:"
    for table in $existing_tables; do
        if [ ! -z "$table" ]; then
            echo "  ✅ $table"
        fi
    done
    
    # Check for missing tables
    missing_tables=()
    for required_table in "${required_tables[@]}"; do
        if ! echo "$existing_tables" | grep -q "^$required_table$"; then
            missing_tables+=("$required_table")
        fi
    done
    
    if [ ${#missing_tables[@]} -eq 0 ]; then
        print_success "All required tables are present"
    else
        print_warning "Missing tables: ${missing_tables[*]}"
    fi
    
    # Check prompt_settings specifically
    prompt_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM prompt_settings;" 2>/dev/null | tr -d ' ')
    if [ "$prompt_count" -gt 0 ]; then
        print_success "prompt_settings table has $prompt_count entries"
    else
        print_warning "prompt_settings table is empty or doesn't exist"
    fi
    
    unset PGPASSWORD
}

# Main execution
main() {
    echo
    print_info "Starting database schema creation..."
    echo
    
    create_database_schema
    verify_schema
    
    echo
    print_success "🎉 Database schema creation completed!"
    echo
    print_info "Your database now includes all required tables:"
    echo "  • vacancies - Job postings and requirements"  
    echo "  • candidates - Candidate information and CVs"
    echo "  • dialogues - Interview conversations"
    echo "  • evaluations - Candidate assessments"
    echo "  • interview_results - Interview outcomes"
    echo "  • prompt_settings - LLM prompts configuration"
    echo "  • system_settings - Application settings"
    echo
    print_info "You can now start the AI HR Bot application!"
    echo "Next: npm run build && npm run dev"
    echo
}

# Run main function
main "$@"
