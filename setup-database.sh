#!/bin/bash

# AI HR Bot Database Setup Script
# This script helps set up PostgreSQL database for the AI HR Bot system

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DB_NAME="hr_bot"
DB_USER="hr_user"
DB_PASSWORD=""
DB_HOST="localhost"
DB_PORT="5432"
SKIP_INIT="false"

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

# Function to check if PostgreSQL is installed
check_postgresql() {
    print_info "Checking if PostgreSQL is installed..."

    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL is not installed or not in PATH"
        print_info "Please install PostgreSQL first:"
        echo "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
        echo "  macOS: brew install postgresql"
        echo "  Docker: docker run --name hr-bot-postgres -e POSTGRES_DB=$DB_NAME -e POSTGRES_USER=$DB_USER -e POSTGRES_PASSWORD=$DB_PASSWORD -p $DB_PORT:5432 -d postgres:15"
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
        echo "  Docker: docker start hr-bot-postgres"
        exit 1
    fi

    print_success "PostgreSQL service is running"
}

# Function to get database password from user
get_db_password() {
    if [ -z "$DB_PASSWORD" ]; then
        echo -n "Enter password for database user '$DB_USER': "
        read -s DB_PASSWORD
        echo
    fi
}

# Function to create database and user
create_database_and_user() {
    print_info "Creating database and user..."

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
        print_info "Creating database '$DB_NAME'..."
        $sudo_cmd psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
        print_success "Database '$DB_NAME' created"
    else
        print_warning "Database '$DB_NAME' already exists"
    fi

    # Grant privileges
    print_info "Granting privileges..."
    $sudo_cmd psql -h $DB_HOST -p $DB_PORT -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    print_success "Privileges granted"
}

# Function to test database connection
test_connection() {
    print_info "Testing database connection..."

    # Create a temporary .env file for testing
    cat > .env.test << EOF
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_SSL=false
DB_MAX_CONNECTIONS=5
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
EOF

    # Test connection using Node.js script
    if command -v node &> /dev/null; then
        if node -e "
            require('dotenv').config({ path: '.env.test' });
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
            pool.query('SELECT version()').then(result => {
                console.log('✅ Database connection successful');
                console.log('📋 PostgreSQL version:', result.rows[0].version.split(' ')[1]);
                pool.end();
                process.exit(0);
            }).catch(err => {
                console.error('❌ Database connection failed:', err.message);
                pool.end();
                process.exit(1);
            });
        "; then
            print_success "Database connection test passed"
        else
            print_error "Database connection test failed"
            rm -f .env.test
            exit 1
        fi
    else
        print_warning "Node.js not found, skipping connection test"
    fi

    # Clean up
    rm -f .env.test
}

# Function to initialize database schema and run migrations
initialize_database() {
    print_info "Initializing database schema and running migrations..."
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        print_error "npm not found. Please install Node.js and npm first"
        exit 1
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_info "Installing dependencies..."
        npm install
        print_success "Dependencies installed"
    fi
    
    # Check if project is built
    if [ ! -d "dist" ]; then
        print_info "Building project..."
        npm run build
        print_success "Project built successfully"
    fi
    
    # Create .env file from template if it doesn't exist (for database connection)
    if [ ! -f ".env" ]; then
        print_info "Creating temporary .env for database initialization..."
        cat > .env << EOF
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_SSL=false
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
TELEGRAM_BOT_TOKEN=temp_token_for_init
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma2:latest
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
EOF
    fi
    
    # Initialize database schema (creates base tables and triggers)
    print_info "Creating core database tables and triggers..."
    if node -e "
        require('dotenv').config();
        const { DatabaseSchema } = require('./dist/database/schema.js');
        DatabaseSchema.initialize().then(() => {
            console.log('✅ Database schema initialized successfully');
            process.exit(0);
        }).catch(err => {
            console.error('❌ Database initialization failed:', err.message);
            process.exit(1);
        });
    "; then
        print_success "Core database schema initialized"
    else
        print_error "Failed to initialize database schema"
        exit 1
    fi
    
    # The schema initialization includes migration execution, so we just need to check status
    print_info "Checking final migration status..."
    npm run db:status
}

# Function to create or update .env file
create_env_file() {
    if [ ! -f .env ]; then
        print_info "Creating .env file..."
        cat > .env << EOF
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

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

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma2:latest

# Application Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
EOF
        print_success ".env file created"
        print_warning "Please edit .env file and set your TELEGRAM_BOT_TOKEN"
    else
        # Check if .env has the temporary token and update it
        if grep -q "temp_token_for_init" .env; then
            print_info "Updating .env file with proper configuration..."
            sed -i "s/TELEGRAM_BOT_TOKEN=temp_token_for_init/TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here/" .env
            sed -i "s/OLLAMA_MODEL=gemma2:latest/OLLAMA_MODEL=gemma2:latest/" .env
            print_success ".env file updated"
            print_warning "Please edit .env file and set your TELEGRAM_BOT_TOKEN"
        else
            print_warning ".env file already exists with custom configuration"
        fi
    fi
}

# Function to show next steps
show_next_steps() {
    print_success "Database setup completed successfully!"
    echo
    print_info "Database Features Enabled:"
    echo "• ✅ Core tables (vacancies, candidates, dialogues, evaluations)"
    echo "• ✅ JSONB validation functions for technical skills and experience"
    echo "• ✅ Performance indexes for efficient querying"
    echo "• ✅ Migration system for schema evolution"
    echo "• ✅ Automatic triggers for timestamp updates"
    echo
    print_info "Next steps:"
    echo "1. Edit .env file and set your TELEGRAM_BOT_TOKEN"
    echo "2. Install dependencies: npm install"
    echo "3. Build the project: npm run build"
    echo "4. Test database connection: npx tsx src/database/test.ts"
    echo "5. Start the application: npm run dev"
    echo
    print_info "Database Management Commands:"
    echo "• Check migration status: npm run db:status"
    echo "• Apply pending migrations: npm run db:migrate"
    echo "• Rollback last migration: npm run db:rollback"
    echo "• Test database connection: npx tsx src/database/test.ts"
    echo
    print_info "Admin Panel Commands:"
    echo "• Build admin panel: npm run build:ui"
    echo "• Start admin panel dev: npm run watch:ui"
    echo "• Start backend dev: npm run watch:server"
    echo
    print_info "Validation Functions Available:"
    echo "• validate_technical_skills(JSONB) - Validates technical skills structure"
    echo "• validate_experience_requirements(JSONB) - Validates experience requirements"
    echo "• validate_evaluation_weights(JSONB) - Ensures weights sum to 100%"
}

# Main function
main() {
    echo
    print_info "🚀 AI HR Bot Database Setup"
    echo "================================"
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
            --skip-init)
                SKIP_INIT="true"
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo
                echo "Options:"
                echo "  --db-name NAME       Database name (default: hr_bot)"
                echo "  --db-user USER       Database user (default: hr_user)"
                echo "  --db-password PASS   Database password (will prompt if not provided)"
                echo "  --db-host HOST       Database host (default: localhost)"
                echo "  --db-port PORT       Database port (default: 5432)"
                echo "  --skip-init          Skip database schema initialization"
                echo "  --help               Show this help message"
                echo
                echo "Examples:"
                echo "  $0"
                echo "  $0 --db-name my_hr_bot --db-user my_user --db-password my_password"
                echo "  $0 --skip-init  # Only create database and user, skip schema initialization"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    # Run setup steps
    check_postgresql
    check_postgresql_service
    get_db_password
    create_database_and_user
    test_connection
    create_env_file
    
    # Conditionally initialize database schema
    if [ "$SKIP_INIT" = "false" ]; then
        initialize_database
    else
        print_warning "Skipping database schema initialization (--skip-init flag used)"
        print_info "You can initialize the schema later with:"
        echo "  npm run build"
        echo "  npm run db:migrate"
    fi
    
    show_next_steps
}

# Run main function
main "$@"
