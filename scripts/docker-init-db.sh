#!/bin/bash

# Docker Database Initialization Script
# This script is designed to run inside a Docker container or with Docker Compose

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Wait for PostgreSQL to be ready
wait_for_postgres() {
    print_status "Waiting for PostgreSQL to be ready..."
    
    until pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${POSTGRES_USER:-postgres}"; do
        echo "PostgreSQL is unavailable - sleeping"
        sleep 2
    done
    
    print_success "PostgreSQL is ready"
}

# Initialize database
init_database() {
    print_status "Initializing database..."
    
    # Create database if it doesn't exist
    psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${POSTGRES_USER:-postgres}" -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME:-hr_bot}'" | grep -q 1 || \
    psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${POSTGRES_USER:-postgres}" -c "CREATE DATABASE ${DB_NAME:-hr_bot};"
    
    # Create user if it doesn't exist
    psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${POSTGRES_USER:-postgres}" -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER:-hr_user}'" | grep -q 1 || \
    psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${POSTGRES_USER:-postgres}" -c "CREATE USER ${DB_USER:-hr_user} WITH PASSWORD '${DB_PASSWORD:-hr_password}';"
    
    # Grant privileges
    psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${POSTGRES_USER:-postgres}" -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME:-hr_bot} TO ${DB_USER:-hr_user};"
    psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${POSTGRES_USER:-postgres}" -d "${DB_NAME:-hr_bot}" -c "GRANT ALL ON SCHEMA public TO ${DB_USER:-hr_user};"
    
    print_success "Database and user configured"
}

# Run schema
run_schema() {
    if [ -f "/app/src/database/schema.sql" ]; then
        print_status "Running database schema..."
        PGPASSWORD="${DB_PASSWORD:-hr_password}" psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-hr_user}" -d "${DB_NAME:-hr_bot}" -f "/app/src/database/schema.sql"
        print_success "Schema applied successfully"
    else
        print_status "Schema file not found, skipping..."
    fi
}

main() {
    echo "🐳 Docker Database Initialization"
    echo "================================="
    
    wait_for_postgres
    init_database
    run_schema
    
    print_success "🎉 Database initialization completed!"
}

main "$@"