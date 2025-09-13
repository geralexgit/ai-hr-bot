#!/bin/bash

# AI HR Bot SaaS Multi-Tenant Database Setup Script
# This script sets up PostgreSQL database for the AI HR Bot SaaS system with multi-tenant support

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Default values
DB_NAME="hr_bot_saas"
DB_USER="hr_saas_user"
DB_PASSWORD=""
DB_HOST="localhost"
DB_PORT="5432"
INTERACTIVE_MODE=true
SKIP_PROMPTS=false

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

print_saas() {
    echo -e "${PURPLE}🏢 $1${NC}"
}

# Function to check if PostgreSQL is installed
check_postgresql() {
    print_info "Checking if PostgreSQL is installed..."

    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL is not installed or not in PATH"
        print_info "Please install PostgreSQL first:"
        echo "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
        echo "  macOS: brew install postgresql"
        echo "  Docker: docker run --name hr-bot-saas-postgres -e POSTGRES_DB=$DB_NAME -e POSTGRES_USER=$DB_USER -e POSTGRES_PASSWORD=$DB_PASSWORD -p $DB_PORT:5432 -d postgres:15"
        exit 1
    fi

    print_success "PostgreSQL is installed"
}

# Function to check if PostgreSQL service is running
check_postgresql_service() {
    print_info "Checking if PostgreSQL service is running..."

    if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
        print_error "PostgreSQL service is not running on $DB_HOST:$DB_PORT"
        print_info "Please start PostgreSQL service:"
        echo "  Ubuntu/Debian: sudo systemctl start postgresql"
        echo "  macOS: brew services start postgresql"
        echo "  Docker: docker start hr-bot-saas-postgres"
        exit 1
    fi

    print_success "PostgreSQL service is running"
}

# Function to prompt user for database configuration
prompt_database_config() {
    if [ "$SKIP_PROMPTS" = true ]; then
        print_info "Using default SaaS database configuration (non-interactive mode)"
        get_db_password
        return
    fi
    
    print_saas "SaaS Multi-Tenant Database Configuration Setup"
    echo "Current configuration:"
    echo "  Database Name: $DB_NAME"
    echo "  Database User: $DB_USER"
    echo "  Database Host: $DB_HOST"
    echo "  Database Port: $DB_PORT"
    echo
    
    if [ "$INTERACTIVE_MODE" = true ]; then
        read -p "Do you want to edit these settings? (y/N): " edit_config
        if [[ $edit_config =~ ^[Yy]$ ]]; then
            edit_database_config
        fi
    fi
    
    get_db_password
}

# Function to interactively edit database configuration
edit_database_config() {
    print_info "Editing SaaS database configuration..."
    echo
    
    read -p "Database name [$DB_NAME]: " new_db_name
    if [ -n "$new_db_name" ]; then
        DB_NAME="$new_db_name"
    fi
    
    read -p "Database user [$DB_USER]: " new_db_user
    if [ -n "$new_db_user" ]; then
        DB_USER="$new_db_user"
    fi
    
    read -p "Database host [$DB_HOST]: " new_db_host
    if [ -n "$new_db_host" ]; then
        DB_HOST="$new_db_host"
    fi
    
    read -p "Database port [$DB_PORT]: " new_db_port
    if [ -n "$new_db_port" ]; then
        DB_PORT="$new_db_port"
    fi
    
    echo
    print_success "Configuration updated:"
    echo "  Database Name: $DB_NAME"
    echo "  Database User: $DB_USER"
    echo "  Database Host: $DB_HOST"
    echo "  Database Port: $DB_PORT"
    echo
}

# Function to get database password from user
get_db_password() {
    if [ -z "$DB_PASSWORD" ]; then
        echo -n "Enter password for database user '$DB_USER': "
        read -s DB_PASSWORD
        echo
        
        if [ -z "$DB_PASSWORD" ]; then
            print_error "Password cannot be empty"
            get_db_password
        fi
    fi
}

# Function to create database and user
create_database_and_user() {
    print_saas "Creating SaaS multi-tenant database and user..."
    echo "This will create:"
    echo "  • Database: $DB_NAME (with multi-tenant support)"
    echo "  • User: $DB_USER"
    echo "  • Host: $DB_HOST:$DB_PORT"
    echo "  • Row-Level Security enabled"
    echo "  • Tenant isolation policies"
    echo
    
    read -p "Proceed with SaaS database creation? (Y/n): " proceed
    if [[ $proceed =~ ^[Nn]$ ]]; then
        print_warning "SaaS database creation cancelled by user"
        exit 0
    fi

    # Check if we're running as postgres user or need sudo
    if [ "$EUID" -eq 0 ] || id -nG "$USER" | grep -qw "postgres" || [ "$USER" = "postgres" ]; then
        # Running as root or postgres user
        sudo_cmd=""
    else
        # Need sudo for PostgreSQL commands
        sudo_cmd="sudo -u postgres"
    fi

    # Create user if it doesn't exist
    if ! $sudo_cmd psql -h $DB_HOST -p $DB_PORT -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
        print_info "Creating database user '$DB_USER'..."
        $sudo_cmd psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
        print_success "Database user '$DB_USER' created"
    else
        print_warning "Database user '$DB_USER' already exists"
    fi

    # Create database if it doesn't exist
    if ! $sudo_cmd psql -h $DB_HOST -p $DB_PORT -U postgres -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
        print_info "Creating SaaS database '$DB_NAME'..."
        $sudo_cmd psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
        print_success "SaaS database '$DB_NAME' created"
    else
        print_warning "SaaS database '$DB_NAME' already exists"
    fi

    # Grant privileges
    print_info "Granting privileges..."
    $sudo_cmd psql -h $DB_HOST -p $DB_PORT -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    print_success "Privileges granted"
}

# Function to create SaaS multi-tenant database schema
create_saas_database_schema() {
    print_saas "Creating SaaS multi-tenant database schema with Row-Level Security..."
    
    # Test if we can connect to the database first
    export PGPASSWORD="$DB_PASSWORD"
    
    # Create SaaS multi-tenant schema using SQL commands
    print_info "Creating SaaS multi-tenant database schema..."
    
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to get current tenant context
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_uuid::TEXT, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CORE SAAS TABLES
-- =====================================================

-- Create tenants table (master tenant registry)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'pending')),
  plan_type VARCHAR(50) DEFAULT 'starter' CHECK (plan_type IN ('starter', 'professional', 'enterprise')),
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table (SaaS platform users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'viewer')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'invited')),
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  last_login TIMESTAMP,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, email)
);

-- Create tenant_configurations table
CREATE TABLE IF NOT EXISTS tenant_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  key VARCHAR(255) NOT NULL,
  value TEXT,
  value_type VARCHAR(50) DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
  is_encrypted BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, category, key)
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid', 'incomplete')),
  plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('starter', 'professional', 'enterprise')),
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  cancelled_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id)
);

-- Create usage_metrics table
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric_type VARCHAR(100) NOT NULL,
  metric_value INTEGER DEFAULT 0,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TENANT-AWARE BUSINESS TABLES
-- =====================================================

-- Create tenant-aware vacancies table
CREATE TABLE IF NOT EXISTS vacancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB NOT NULL,
  evaluation_weights JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tenant-aware candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  telegram_user_id BIGINT NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  username VARCHAR(255),
  cv_file_path VARCHAR(500),
  cv_file_name VARCHAR(255),
  cv_file_size INTEGER,
  cv_uploaded_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, telegram_user_id)
);

-- Create tenant-aware dialogues table
CREATE TABLE IF NOT EXISTS dialogues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE,
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('text', 'audio', 'system', 'document')),
  content TEXT NOT NULL,
  audio_file_path VARCHAR(500),
  transcription TEXT,
  document_file_path VARCHAR(500),
  document_file_name VARCHAR(255),
  document_file_size INTEGER,
  sender VARCHAR(50) NOT NULL CHECK (sender IN ('candidate', 'bot')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tenant-aware evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE,
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
  evaluated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, candidate_id, vacancy_id)
);

-- Create tenant-aware interview_results table
CREATE TABLE IF NOT EXISTS interview_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dialogue_id UUID REFERENCES dialogues(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE,
  evaluation_id UUID REFERENCES evaluations(id) ON DELETE SET NULL,
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
  conducted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, candidate_id, vacancy_id)
);

-- Create tenant-aware prompt_settings table
CREATE TABLE IF NOT EXISTS prompt_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, name)
);

-- Create tenant-aware system_settings table (tenant-specific settings)
CREATE TABLE IF NOT EXISTS tenant_system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  value_type VARCHAR(50) NOT NULL DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, key)
);

-- Create audit_logs table for security and compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ROW-LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tenant-aware tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants table (users can only see their own tenant)
CREATE POLICY tenant_isolation_policy ON tenants
  FOR ALL TO PUBLIC
  USING (id = current_tenant_id());

-- RLS Policies for users table
CREATE POLICY user_tenant_isolation_policy ON users
  FOR ALL TO PUBLIC
  USING (tenant_id = current_tenant_id());

-- RLS Policies for tenant_configurations table
CREATE POLICY tenant_configurations_isolation_policy ON tenant_configurations
  FOR ALL TO PUBLIC
  USING (tenant_id = current_tenant_id());

-- RLS Policies for subscriptions table
CREATE POLICY subscriptions_isolation_policy ON subscriptions
  FOR ALL TO PUBLIC
  USING (tenant_id = current_tenant_id());

-- RLS Policies for usage_metrics table
CREATE POLICY usage_metrics_isolation_policy ON usage_metrics
  FOR ALL TO PUBLIC
  USING (tenant_id = current_tenant_id());

-- RLS Policies for vacancies table
CREATE POLICY vacancies_isolation_policy ON vacancies
  FOR ALL TO PUBLIC
  USING (tenant_id = current_tenant_id());

-- RLS Policies for candidates table
CREATE POLICY candidates_isolation_policy ON candidates
  FOR ALL TO PUBLIC
  USING (tenant_id = current_tenant_id());

-- RLS Policies for dialogues table
CREATE POLICY dialogues_isolation_policy ON dialogues
  FOR ALL TO PUBLIC
  USING (tenant_id = current_tenant_id());

-- RLS Policies for evaluations table
CREATE POLICY evaluations_isolation_policy ON evaluations
  FOR ALL TO PUBLIC
  USING (tenant_id = current_tenant_id());

-- RLS Policies for interview_results table
CREATE POLICY interview_results_isolation_policy ON interview_results
  FOR ALL TO PUBLIC
  USING (tenant_id = current_tenant_id());

-- RLS Policies for prompt_settings table
CREATE POLICY prompt_settings_isolation_policy ON prompt_settings
  FOR ALL TO PUBLIC
  USING (tenant_id = current_tenant_id());

-- RLS Policies for tenant_system_settings table
CREATE POLICY tenant_system_settings_isolation_policy ON tenant_system_settings
  FOR ALL TO PUBLIC
  USING (tenant_id = current_tenant_id());

-- RLS Policies for audit_logs table
CREATE POLICY audit_logs_isolation_policy ON audit_logs
  FOR ALL TO PUBLIC
  USING (tenant_id = current_tenant_id() OR tenant_id IS NULL);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Core tenant indexes
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan_type ON tenants(plan_type);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Configuration indexes
CREATE INDEX IF NOT EXISTS idx_tenant_configurations_tenant_id ON tenant_configurations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_configurations_category ON tenant_configurations(category);
CREATE INDEX IF NOT EXISTS idx_tenant_configurations_key ON tenant_configurations(key);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- Usage metrics indexes
CREATE INDEX IF NOT EXISTS idx_usage_metrics_tenant_id ON usage_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_type ON usage_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_period ON usage_metrics(period_start, period_end);

-- Business logic indexes
CREATE INDEX IF NOT EXISTS idx_vacancies_tenant_id ON vacancies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_status ON vacancies(status);
CREATE INDEX IF NOT EXISTS idx_vacancies_created_by ON vacancies(created_by);

CREATE INDEX IF NOT EXISTS idx_candidates_tenant_id ON candidates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_candidates_telegram_user ON candidates(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_tenant_telegram ON candidates(tenant_id, telegram_user_id);

CREATE INDEX IF NOT EXISTS idx_dialogues_tenant_id ON dialogues(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dialogues_candidate_vacancy ON dialogues(candidate_id, vacancy_id);
CREATE INDEX IF NOT EXISTS idx_dialogues_created_at ON dialogues(created_at);

CREATE INDEX IF NOT EXISTS idx_evaluations_tenant_id ON evaluations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_candidate_vacancy ON evaluations(candidate_id, vacancy_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_recommendation ON evaluations(recommendation);

CREATE INDEX IF NOT EXISTS idx_interview_results_tenant_id ON interview_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_interview_results_status ON interview_results(interview_status);
CREATE INDEX IF NOT EXISTS idx_interview_results_created_at ON interview_results(created_at);

CREATE INDEX IF NOT EXISTS idx_prompt_settings_tenant_id ON prompt_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_prompt_settings_name ON prompt_settings(name);
CREATE INDEX IF NOT EXISTS idx_prompt_settings_category ON prompt_settings(category);

CREATE INDEX IF NOT EXISTS idx_tenant_system_settings_tenant_id ON tenant_system_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_system_settings_key ON tenant_system_settings(key);
CREATE INDEX IF NOT EXISTS idx_tenant_system_settings_category ON tenant_system_settings(category);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

-- Tenants triggers
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Users triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tenant configurations triggers
DROP TRIGGER IF EXISTS update_tenant_configurations_updated_at ON tenant_configurations;
CREATE TRIGGER update_tenant_configurations_updated_at
  BEFORE UPDATE ON tenant_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Subscriptions triggers
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Usage metrics triggers
DROP TRIGGER IF EXISTS update_usage_metrics_updated_at ON usage_metrics;
CREATE TRIGGER update_usage_metrics_updated_at
  BEFORE UPDATE ON usage_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vacancies triggers
DROP TRIGGER IF EXISTS update_vacancies_updated_at ON vacancies;
CREATE TRIGGER update_vacancies_updated_at
  BEFORE UPDATE ON vacancies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Candidates triggers
DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates;
CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dialogues triggers
DROP TRIGGER IF EXISTS update_dialogues_updated_at ON dialogues;
CREATE TRIGGER update_dialogues_updated_at
  BEFORE UPDATE ON dialogues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Evaluations triggers
DROP TRIGGER IF EXISTS update_evaluations_updated_at ON evaluations;
CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Interview results triggers
DROP TRIGGER IF EXISTS update_interview_results_updated_at ON interview_results;
CREATE TRIGGER update_interview_results_updated_at
  BEFORE UPDATE ON interview_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Prompt settings triggers
DROP TRIGGER IF EXISTS update_prompt_settings_updated_at ON prompt_settings;
CREATE TRIGGER update_prompt_settings_updated_at
  BEFORE UPDATE ON prompt_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tenant system settings triggers
DROP TRIGGER IF EXISTS update_tenant_system_settings_updated_at ON tenant_system_settings;
CREATE TRIGGER update_tenant_system_settings_updated_at
  BEFORE UPDATE ON tenant_system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DEFAULT DATA FOR SAAS SYSTEM
-- =====================================================

-- Insert default system tenant (for system-wide configurations)
INSERT INTO tenants (id, name, subdomain, status, plan_type) VALUES
('00000000-0000-0000-0000-000000000000', 'System Tenant', 'system', 'active', 'enterprise')
ON CONFLICT (id) DO NOTHING;

-- Insert default prompt settings for new tenants
-- These will be copied to new tenants during tenant creation
INSERT INTO prompt_settings (id, tenant_id, name, description, prompt_template, category) VALUES
(
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000000',
  'cv_analysis',
  'Default prompt for analyzing uploaded CV/resume files',
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
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000000',
  'resume_analysis',
  'Default prompt for analyzing resume text provided in chat',
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
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000000',
  'interview_chat',
  'Default prompt for conducting interview conversations with candidates',
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
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Insert default system settings for SaaS
INSERT INTO tenant_system_settings (tenant_id, key, value, description, category, value_type) VALUES
('00000000-0000-0000-0000-000000000000', 'default_llm_provider', 'ollama', 'Default LLM provider for new tenants', 'llm', 'string'),
('00000000-0000-0000-0000-000000000000', 'default_ollama_base_url', 'http://localhost:11434', 'Default Ollama API base URL', 'llm', 'string'),
('00000000-0000-0000-0000-000000000000', 'default_ollama_model', 'gemma3n:latest', 'Default Ollama model', 'llm', 'string'),
('00000000-0000-0000-0000-000000000000', 'max_candidates_starter', '100', 'Maximum candidates for starter plan', 'limits', 'number'),
('00000000-0000-0000-0000-000000000000', 'max_candidates_professional', '1000', 'Maximum candidates for professional plan', 'limits', 'number'),
('00000000-0000-0000-0000-000000000000', 'max_candidates_enterprise', '-1', 'Maximum candidates for enterprise plan (-1 = unlimited)', 'limits', 'number'),
('00000000-0000-0000-0000-000000000000', 'max_llm_calls_starter', '1000', 'Maximum LLM calls per month for starter plan', 'limits', 'number'),
('00000000-0000-0000-0000-000000000000', 'max_llm_calls_professional', '10000', 'Maximum LLM calls per month for professional plan', 'limits', 'number'),
('00000000-0000-0000-0000-000000000000', 'max_llm_calls_enterprise', '-1', 'Maximum LLM calls per month for enterprise plan (-1 = unlimited)', 'limits', 'number')
ON CONFLICT (tenant_id, key) DO NOTHING;

EOF

    if [ $? -eq 0 ]; then
        print_success "SaaS multi-tenant database schema created successfully"
    else
        print_error "Failed to create SaaS database schema"
        exit 1
    fi
    
    # Clear the password from environment
    unset PGPASSWORD
}

# Function to test database connection
test_connection() {
    print_info "Testing SaaS database connection..."

    # Create a temporary .env file for testing
    cat > .env.saas.test << EOF
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_SSL=false
DB_MAX_CONNECTIONS=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
EOF

    # Test connection using Node.js script if available
    if command -v node &> /dev/null; then
        if node -e "
            require('dotenv').config({ path: '.env.saas.test' });
            const { Pool } = require('pg');
            const pool = new Pool({
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                database: process.env.DB_NAME,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                ssl: process.env.DB_SSL === 'true',
                max: parseInt(process.env.DB_MAX_CONNECTIONS),
                idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT),
                connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT)
            });
            pool.query('SELECT version(), COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = \'public\'').then(result => {
                console.log('✅ SaaS Database connection successful');
                console.log('📋 PostgreSQL version:', result.rows[0].version.split(' ')[1]);
                console.log('🏢 Tables created:', result.rows[0].table_count);
                pool.end();
                process.exit(0);
            }).catch(err => {
                console.error('❌ SaaS Database connection failed:', err.message);
                pool.end();
                process.exit(1);
            });
        "; then
            print_success "SaaS database connection test passed"
        else
            print_error "SaaS database connection test failed"
            rm -f .env.saas.test
            exit 1
        fi
    else
        print_warning "Node.js not found, skipping connection test"
    fi

    # Clean up
    rm -f .env.saas.test
}

# Function to create .env file for SaaS
create_saas_env_file() {
    if [ ! -f .env.saas ]; then
        create_new_saas_env_file
    else
        print_warning ".env.saas file already exists"
        read -p "Do you want to update it with new SaaS database settings? (y/N): " update_env
        if [[ $update_env =~ ^[Yy]$ ]]; then
            update_existing_saas_env_file
        else
            print_info "Keeping existing .env.saas file unchanged"
        fi
    fi
}

# Function to create new .env.saas file with prompts
create_new_saas_env_file() {
    print_saas "Creating .env.saas file for SaaS configuration..."
    
    # Prompt for additional SaaS configuration
    read -p "Enter JWT Secret (or press Enter to generate): " jwt_secret
    if [ -z "$jwt_secret" ]; then
        jwt_secret=$(openssl rand -hex 32)
    fi
    
    read -p "Enter Redis URL [redis://localhost:6379]: " redis_url
    if [ -z "$redis_url" ]; then
        redis_url="redis://localhost:6379"
    fi
    
    read -p "Enter Stripe Secret Key (or press Enter to set later): " stripe_secret
    if [ -z "$stripe_secret" ]; then
        stripe_secret="sk_test_your_stripe_secret_key_here"
    fi
    
    read -p "Enter application port [3001]: " app_port
    if [ -z "$app_port" ]; then
        app_port="3001"
    fi
    
    read -p "Enter frontend URL [http://localhost:3000]: " frontend_url
    if [ -z "$frontend_url" ]; then
        frontend_url="http://localhost:3000"
    fi
    
    cat > .env.saas << EOF
# SaaS Multi-Tenant Configuration

# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_SSL=false
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

# Authentication & Security
JWT_SECRET=$jwt_secret
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Session Management
REDIS_URL=$redis_url
SESSION_SECRET=$jwt_secret

# Stripe Configuration
STRIPE_SECRET_KEY=$stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_STARTER=price_starter_plan_id
STRIPE_PRICE_PROFESSIONAL=price_professional_plan_id
STRIPE_PRICE_ENTERPRISE=price_enterprise_plan_id

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@yourcompany.com

# Application Configuration
PORT=$app_port
NODE_ENV=development
LOG_LEVEL=info
FRONTEND_URL=$frontend_url
API_BASE_URL=http://localhost:$app_port

# Default LLM Configuration (can be overridden per tenant)
DEFAULT_LLM_PROVIDER=ollama
DEFAULT_OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_OLLAMA_MODEL=gemma3n:latest

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=pdf,doc,docx,txt

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring & Analytics
ENABLE_ANALYTICS=true
ANALYTICS_RETENTION_DAYS=90
EOF
    print_success ".env.saas file created"
    
    if [ "$stripe_secret" = "sk_test_your_stripe_secret_key_here" ]; then
        print_warning "Please edit .env.saas file and set your STRIPE_SECRET_KEY"
    fi
}

# Function to update existing .env.saas file
update_existing_saas_env_file() {
    print_info "Updating existing .env.saas file with new database settings..."
    
    # Create backup
    cp .env.saas .env.saas.backup
    print_info "Backup created: .env.saas.backup"
    
    # Update database settings in existing .env.saas file
    sed -i "s/^DB_HOST=.*/DB_HOST=$DB_HOST/" .env.saas
    sed -i "s/^DB_PORT=.*/DB_PORT=$DB_PORT/" .env.saas
    sed -i "s/^DB_NAME=.*/DB_NAME=$DB_NAME/" .env.saas
    sed -i "s/^DB_USER=.*/DB_USER=$DB_USER/" .env.saas
    sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env.saas
    
    print_success ".env.saas file updated with new database settings"
}

# Function to show SaaS configuration summary
show_saas_configuration_summary() {
    print_saas "SaaS Multi-Tenant Configuration Summary"
    echo "========================================"
    echo "Database Configuration:"
    echo "  • Host: $DB_HOST"
    echo "  • Port: $DB_PORT"
    echo "  • Database: $DB_NAME"
    echo "  • User: $DB_USER"
    echo "  • Password: [Set]"
    echo "  • Multi-Tenant: ✅ Enabled"
    echo "  • Row-Level Security: ✅ Enabled"
    echo "  • UUID Primary Keys: ✅ Enabled"
    echo
    
    if [ -f .env.saas ]; then
        echo "SaaS Environment File:"
        echo "  • Location: $(pwd)/.env.saas"
        echo "  • JWT Secret: [Set]"
        echo "  • Redis URL: $(grep "^REDIS_URL=" .env.saas | cut -d'=' -f2)"
        echo "  • Stripe Key: $(grep "^STRIPE_SECRET_KEY=" .env.saas | cut -d'=' -f2 | sed 's/sk_test_your_stripe_secret_key_here/[NOT SET]/')"
        echo "  • Application Port: $(grep "^PORT=" .env.saas | cut -d'=' -f2)"
    fi
    echo "========================================"
    echo
}

# Function to show next steps for SaaS setup
show_saas_next_steps() {
    show_saas_configuration_summary
    
    print_success "🎉 SaaS Multi-Tenant Database setup completed successfully!"
    echo
    print_saas "SaaS Database includes all required tables with tenant isolation:"
    echo "  🏢 tenants - Tenant registry and management"
    echo "  👥 users - Multi-tenant user authentication"
    echo "  ⚙️  tenant_configurations - Tenant-specific settings"
    echo "  💳 subscriptions - Billing and subscription management"
    echo "  📊 usage_metrics - Usage tracking and analytics"
    echo "  📝 vacancies - Tenant-isolated job postings"
    echo "  👤 candidates - Tenant-isolated candidate data"
    echo "  💬 dialogues - Tenant-isolated conversations"
    echo "  📋 evaluations - Tenant-isolated assessments"
    echo "  🎯 interview_results - Tenant-isolated interview outcomes"
    echo "  🤖 prompt_settings - Tenant-specific LLM prompts"
    echo "  🔧 tenant_system_settings - Tenant system configuration"
    echo "  📜 audit_logs - Security and compliance logging"
    echo
    print_info "Next steps:"
    echo "1. 📋 Review your .env.saas file configuration"
    
    # Check if critical settings are configured
    if [ -f .env.saas ]; then
        stripe_key=$(grep "^STRIPE_SECRET_KEY=" .env.saas | cut -d'=' -f2)
        if [ "$stripe_key" = "sk_test_your_stripe_secret_key_here" ] || [ -z "$stripe_key" ]; then
            echo "2. 💳 Set your STRIPE_SECRET_KEY in the .env.saas file"
            echo "3. 📦 Install SaaS dependencies: npm install"
        else
            echo "2. 📦 Install SaaS dependencies: npm install"
        fi
    else
        echo "2. 📦 Install SaaS dependencies: npm install"
    fi
    
    echo "3. 🔨 Build the SaaS project: npm run build"
    echo "4. 🧪 Test SaaS database connection: npx tsx src/database/test.ts"
    echo "5. 🚀 Start the SaaS application: npm run dev:saas"
    echo
    print_info "SaaS-specific useful commands:"
    echo "• 🔍 Test SaaS database: npx tsx src/database/saas-test.ts"
    echo "• 🏢 Create demo tenant: npx tsx scripts/create-demo-tenant.ts"
    echo "• 👥 List all tenants: npx tsx scripts/list-tenants.ts"
    echo "• 🔄 Reset SaaS database: npx tsx -e \"import { SaasDatabaseInitializer } from './src/database/saas-init.js'; SaasDatabaseInitializer.reset();\""
    echo "• 📊 View tenant usage: npx tsx scripts/tenant-usage.ts [tenant-id]"
    echo "• 📝 Edit .env.saas file: nano .env.saas"
    echo "• 🔧 Re-run SaaS setup: ./setup-saas-database.sh"
    echo
    
    # Final validation reminder
    if [ -f .env.saas ]; then
        stripe_key=$(grep "^STRIPE_SECRET_KEY=" .env.saas | cut -d'=' -f2)
        if [ "$stripe_key" = "sk_test_your_stripe_secret_key_here" ] || [ -z "$stripe_key" ]; then
            print_warning "⚠️  Don't forget to set your STRIPE_SECRET_KEY in the .env.saas file!"
        fi
    fi
    
    print_saas "🏢 Your AI HR Bot SaaS Multi-Tenant system is ready to configure!"
    echo
    print_info "Key SaaS Features Enabled:"
    echo "  ✅ Complete tenant data isolation with Row-Level Security"
    echo "  ✅ UUID-based primary keys for better scalability"
    echo "  ✅ Multi-tenant user authentication and authorization"
    echo "  ✅ Subscription and billing management"
    echo "  ✅ Usage tracking and analytics"
    echo "  ✅ Audit logging for compliance and security"
    echo "  ✅ Tenant-specific configuration management"
    echo "  ✅ Default prompt templates for new tenants"
}

# Main function
main() {
    echo
    print_saas "🚀 AI HR Bot SaaS Multi-Tenant Database Setup"
    echo "================================================="
    echo

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --db-name)
                DB_NAME="$2"
                shift 2
                ;;
            --db-user)
                DB_USER="$2"
                shift 2
                ;;
            --db-password)
                DB_PASSWORD="$2"
                shift 2
                ;;
            --db-host)
                DB_HOST="$2"
                shift 2
                ;;
            --db-port)
                DB_PORT="$2"
                shift 2
                ;;
            --non-interactive)
                INTERACTIVE_MODE=false
                SKIP_PROMPTS=true
                shift
                ;;
            --skip-prompts)
                SKIP_PROMPTS=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo
                echo "SaaS Multi-Tenant Database Setup Options:"
                echo "  --db-name NAME       Database name (default: hr_bot_saas)"
                echo "  --db-user USER       Database user (default: hr_saas_user)"
                echo "  --db-password PASS   Database password (will prompt if not provided)"
                echo "  --db-host HOST       Database host (default: localhost)"
                echo "  --db-port PORT       Database port (default: 5432)"
                echo "  --non-interactive    Run in non-interactive mode (skip all prompts)"
                echo "  --skip-prompts       Skip configuration prompts but allow .env editing"
                echo "  --help               Show this help message"
                echo
                echo "Examples:"
                echo "  $0                                           # Interactive SaaS setup"
                echo "  $0 --non-interactive --db-password secret   # Non-interactive SaaS setup"
                echo "  $0 --skip-prompts                          # Skip config prompts only"
                echo "  $0 --db-name my_hr_saas --db-user saas_user # Custom SaaS database settings"
                echo
                echo "Features:"
                echo "  🏢 Multi-tenant architecture with complete data isolation"
                echo "  🔒 Row-Level Security (RLS) policies for tenant separation"
                echo "  🆔 UUID-based primary keys for better scalability"
                echo "  💳 Subscription and billing management"
                echo "  📊 Usage tracking and analytics"
                echo "  📜 Comprehensive audit logging"
                echo "  ⚙️  Tenant-specific configuration management"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    # Run SaaS setup steps
    check_postgresql
    check_postgresql_service
    prompt_database_config
    create_database_and_user
    create_saas_database_schema
    test_connection
    create_saas_env_file
    show_saas_next_steps
}

# Run main function
main "$@"
