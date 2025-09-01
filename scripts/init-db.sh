#!/bin/bash

# HR Bot Database Initialization Script
# This script sets up the PostgreSQL database for the HR Bot system

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-hr_bot}
DB_USER=${DB_USER:-hr_user}
DB_PASSWORD=${DB_PASSWORD:-hr_password}
POSTGRES_USER=${POSTGRES_USER:-postgres}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if PostgreSQL is running
check_postgres() {
    print_status "Checking if PostgreSQL is running..."
    
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL client (psql) is not installed or not in PATH"
        print_status "Please install PostgreSQL client tools"
        exit 1
    fi
    
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" &> /dev/null; then
        print_error "PostgreSQL server is not running on $DB_HOST:$DB_PORT"
        print_status "Please start PostgreSQL server first"
        exit 1
    fi
    
    print_success "PostgreSQL is running"
}

# Function to create database and user
create_database() {
    print_status "Creating database and user..."
    
    # Check if database exists
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        print_warning "Database '$DB_NAME' already exists"
    else
        print_status "Creating database '$DB_NAME'..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" -c "CREATE DATABASE $DB_NAME;"
        print_success "Database '$DB_NAME' created"
    fi
    
    # Check if user exists
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" -t -c "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
        print_warning "User '$DB_USER' already exists"
    else
        print_status "Creating user '$DB_USER'..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
        print_success "User '$DB_USER' created"
    fi
    
    # Grant privileges
    print_status "Granting privileges to user '$DB_USER'..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
    print_success "Privileges granted"
}

# Function to run database schema
run_schema() {
    print_status "Running database schema..."
    
    if [ ! -f "src/database/schema.sql" ]; then
        print_error "Schema file 'src/database/schema.sql' not found"
        print_status "Please run this script from the project root directory"
        exit 1
    fi
    
    # Set environment variables for the connection
    export PGPASSWORD="$DB_PASSWORD"
    
    print_status "Executing schema.sql..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "src/database/schema.sql"
    
    unset PGPASSWORD
    print_success "Database schema applied successfully"
}

# Function to verify installation
verify_installation() {
    print_status "Verifying database installation..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Check tables
    TABLES=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;")
    
    unset PGPASSWORD
    
    if [ -z "$TABLES" ]; then
        print_error "No tables found in database"
        exit 1
    fi
    
    print_success "Database verification completed"
    echo "Tables created:"
    echo "$TABLES" | while read -r table; do
        if [ -n "$table" ]; then
            echo "  - $table"
        fi
    done
}

# Function to create .env file
create_env_file() {
    if [ ! -f ".env" ]; then
        print_status "Creating .env file from .env.example..."
        
        if [ -f ".env.example" ]; then
            cp .env.example .env
            
            # Update database configuration in .env
            sed -i.bak "s/DB_HOST=.*/DB_HOST=$DB_HOST/" .env
            sed -i.bak "s/DB_PORT=.*/DB_PORT=$DB_PORT/" .env
            sed -i.bak "s/DB_NAME=.*/DB_NAME=$DB_NAME/" .env
            sed -i.bak "s/DB_USER=.*/DB_USER=$DB_USER/" .env
            sed -i.bak "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
            
            # Remove backup file
            rm -f .env.bak
            
            print_success ".env file created with database configuration"
        else
            print_warning ".env.example not found, skipping .env creation"
        fi
    else
        print_warning ".env file already exists, skipping creation"
    fi
}

# Function to test connection
test_connection() {
    print_status "Testing database connection with Node.js application..."
    
    if [ -f "package.json" ] && command -v npm &> /dev/null; then
        print_status "Building application..."
        npm run build
        
        if [ -f "dist/test-db.js" ]; then
            print_status "Running database test..."
            npm run test:db
            print_success "Database test completed successfully"
        else
            print_warning "Test script not found, skipping application test"
        fi
    else
        print_warning "Node.js/npm not available, skipping application test"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  --host HOST             Database host (default: localhost)"
    echo "  --port PORT             Database port (default: 5432)"
    echo "  --dbname NAME           Database name (default: hr_bot)"
    echo "  --user USER             Database user (default: hr_user)"
    echo "  --password PASSWORD     Database password (default: hr_password)"
    echo "  --postgres-user USER    PostgreSQL admin user (default: postgres)"
    echo "  --skip-create           Skip database/user creation"
    echo "  --skip-schema           Skip schema execution"
    echo "  --skip-test             Skip connection test"
    echo ""
    echo "Environment variables:"
    echo "  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, POSTGRES_USER"
    echo ""
    echo "Examples:"
    echo "  $0                                          # Use default values"
    echo "  $0 --host myserver --port 5433              # Custom host and port"
    echo "  $0 --password mypassword --skip-test        # Custom password, skip test"
}

# Parse command line arguments
SKIP_CREATE=false
SKIP_SCHEMA=false
SKIP_TEST=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        --host)
            DB_HOST="$2"
            shift 2
            ;;
        --port)
            DB_PORT="$2"
            shift 2
            ;;
        --dbname)
            DB_NAME="$2"
            shift 2
            ;;
        --user)
            DB_USER="$2"
            shift 2
            ;;
        --password)
            DB_PASSWORD="$2"
            shift 2
            ;;
        --postgres-user)
            POSTGRES_USER="$2"
            shift 2
            ;;
        --skip-create)
            SKIP_CREATE=true
            shift
            ;;
        --skip-schema)
            SKIP_SCHEMA=true
            shift
            ;;
        --skip-test)
            SKIP_TEST=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    echo "🚀 HR Bot Database Initialization"
    echo "=================================="
    echo ""
    
    print_status "Configuration:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo "  PostgreSQL Admin: $POSTGRES_USER"
    echo ""
    
    # Check PostgreSQL
    check_postgres
    
    # Create database and user (unless skipped)
    if [ "$SKIP_CREATE" = false ]; then
        create_database
    else
        print_warning "Skipping database/user creation"
    fi
    
    # Run schema (unless skipped)
    if [ "$SKIP_SCHEMA" = false ]; then
        run_schema
        verify_installation
    else
        print_warning "Skipping schema execution"
    fi
    
    # Create .env file
    create_env_file
    
    # Test connection (unless skipped)
    if [ "$SKIP_TEST" = false ]; then
        test_connection
    else
        print_warning "Skipping connection test"
    fi
    
    echo ""
    print_success "🎉 Database initialization completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "  1. Review the .env file and update any missing configuration"
    echo "  2. Start your application with: npm run dev"
    echo "  3. Test the database connection with: npm run test:db"
    echo ""
}

# Run main function
main "$@"