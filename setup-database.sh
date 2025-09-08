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

# Function to prompt user for database configuration
prompt_database_config() {
    if [ "$SKIP_PROMPTS" = true ]; then
        print_info "Using default database configuration (non-interactive mode)"
        get_db_password
        return
    fi
    
    print_info "Database Configuration Setup"
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
    print_info "Editing database configuration..."
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
    print_info "Creating database and user..."
    echo "This will create:"
    echo "  • Database: $DB_NAME"
    echo "  • User: $DB_USER"
    echo "  • Host: $DB_HOST:$DB_PORT"
    echo
    
    read -p "Proceed with database creation? (Y/n): " proceed
    if [[ $proceed =~ ^[Nn]$ ]]; then
        print_warning "Database creation cancelled by user"
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

# Function to create .env file
create_env_file() {
    if [ ! -f .env ]; then
        create_new_env_file
    else
        print_warning ".env file already exists"
        read -p "Do you want to update it with new database settings? (y/N): " update_env
        if [[ $update_env =~ ^[Yy]$ ]]; then
            update_existing_env_file
        else
            print_info "Keeping existing .env file unchanged"
        fi
    fi
}

# Function to create new .env file with prompts
create_new_env_file() {
    print_info "Creating .env file..."
    
    # Prompt for additional configuration
    read -p "Enter Telegram Bot Token (or press Enter to set later): " telegram_token
    if [ -z "$telegram_token" ]; then
        telegram_token="your_telegram_bot_token_here"
    fi
    
    read -p "Enter Ollama base URL [$OLLAMA_BASE_URL]: " ollama_url
    if [ -z "$ollama_url" ]; then
        ollama_url="http://localhost:11434"
    fi
    
    read -p "Enter Ollama model [$OLLAMA_MODEL]: " ollama_model
    if [ -z "$ollama_model" ]; then
        ollama_model="gemma3n:latest"
    fi
    
    read -p "Enter application port [3000]: " app_port
    if [ -z "$app_port" ]; then
        app_port="3000"
    fi
    
    cat > .env << EOF
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=$telegram_token

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
OLLAMA_BASE_URL=$ollama_url
OLLAMA_MODEL=$ollama_model

# Application Configuration
PORT=$app_port
NODE_ENV=development
LOG_LEVEL=info
EOF
    print_success ".env file created"
    
    if [ "$telegram_token" = "your_telegram_bot_token_here" ]; then
        print_warning "Please edit .env file and set your TELEGRAM_BOT_TOKEN"
    fi
}

# Function to update existing .env file
update_existing_env_file() {
    print_info "Updating existing .env file with new database settings..."
    
    # Create backup
    cp .env .env.backup
    print_info "Backup created: .env.backup"
    
    # Update database settings in existing .env file
    sed -i "s/^DB_HOST=.*/DB_HOST=$DB_HOST/" .env
    sed -i "s/^DB_PORT=.*/DB_PORT=$DB_PORT/" .env
    sed -i "s/^DB_NAME=.*/DB_NAME=$DB_NAME/" .env
    sed -i "s/^DB_USER=.*/DB_USER=$DB_USER/" .env
    sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
    
    print_success ".env file updated with new database settings"
}

# Function to prompt user to edit .env file
prompt_edit_env_file() {
    if [ "$SKIP_PROMPTS" = true ]; then
        print_info "Skipping .env file editing (non-interactive mode)"
        return
    fi
    
    print_info "Environment Configuration Review"
    echo
    
    if [ -f .env ]; then
        print_info "Current .env file contents:"
        echo "================================"
        cat .env | grep -E "^[A-Z_]+" | head -15
        echo "================================"
        echo
        
        if [ "$INTERACTIVE_MODE" = true ]; then
            read -p "Do you want to edit the .env file now? (y/N): " edit_env
            if [[ $edit_env =~ ^[Yy]$ ]]; then
                edit_env_file_interactive
            fi
            
            read -p "Do you want to view the complete .env file? (y/N): " view_env
            if [[ $view_env =~ ^[Yy]$ ]]; then
                print_info "Complete .env file:"
                echo "================================"
                cat .env
                echo "================================"
            fi
        else
            print_info "Interactive mode disabled. You can edit .env manually later."
        fi
    else
        print_error ".env file not found"
    fi
}

# Function to interactively edit .env file
edit_env_file_interactive() {
    print_info "Interactive .env file editor"
    echo "You can edit the following settings:"
    echo
    
    # Read current values from .env
    if [ -f .env ]; then
        current_telegram_token=$(grep "^TELEGRAM_BOT_TOKEN=" .env | cut -d'=' -f2)
        current_ollama_url=$(grep "^OLLAMA_BASE_URL=" .env | cut -d'=' -f2)
        current_ollama_model=$(grep "^OLLAMA_MODEL=" .env | cut -d'=' -f2)
        current_port=$(grep "^PORT=" .env | cut -d'=' -f2)
        current_log_level=$(grep "^LOG_LEVEL=" .env | cut -d'=' -f2)
    fi
    
    # Telegram Bot Token
    echo "Current Telegram Bot Token: $current_telegram_token"
    read -p "Enter new Telegram Bot Token (or press Enter to keep current): " new_telegram_token
    if [ -n "$new_telegram_token" ]; then
        sed -i "s/^TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN=$new_telegram_token/" .env
        print_success "Telegram Bot Token updated"
    fi
    
    # Ollama URL
    echo "Current Ollama Base URL: $current_ollama_url"
    read -p "Enter new Ollama Base URL (or press Enter to keep current): " new_ollama_url
    if [ -n "$new_ollama_url" ]; then
        sed -i "s|^OLLAMA_BASE_URL=.*|OLLAMA_BASE_URL=$new_ollama_url|" .env
        print_success "Ollama Base URL updated"
    fi
    
    # Ollama Model
    echo "Current Ollama Model: $current_ollama_model"
    read -p "Enter new Ollama Model (or press Enter to keep current): " new_ollama_model
    if [ -n "$new_ollama_model" ]; then
        sed -i "s/^OLLAMA_MODEL=.*/OLLAMA_MODEL=$new_ollama_model/" .env
        print_success "Ollama Model updated"
    fi
    
    # Application Port
    echo "Current Application Port: $current_port"
    read -p "Enter new Application Port (or press Enter to keep current): " new_port
    if [ -n "$new_port" ]; then
        # Validate port number
        if [[ "$new_port" =~ ^[0-9]+$ ]] && [ "$new_port" -ge 1 ] && [ "$new_port" -le 65535 ]; then
            sed -i "s/^PORT=.*/PORT=$new_port/" .env
            print_success "Application Port updated"
        else
            print_error "Invalid port number. Port must be between 1 and 65535"
        fi
    fi
    
    # Log Level
    echo "Current Log Level: $current_log_level"
    echo "Available options: error, warn, info, debug"
    read -p "Enter new Log Level (or press Enter to keep current): " new_log_level
    if [ -n "$new_log_level" ]; then
        if [[ "$new_log_level" =~ ^(error|warn|info|debug)$ ]]; then
            sed -i "s/^LOG_LEVEL=.*/LOG_LEVEL=$new_log_level/" .env
            print_success "Log Level updated"
        else
            print_error "Invalid log level. Must be one of: error, warn, info, debug"
        fi
    fi
    
    echo
    print_success ".env file editing completed"
}

# Function to show configuration summary
show_configuration_summary() {
    print_info "Configuration Summary"
    echo "===================="
    echo "Database Configuration:"
    echo "  • Host: $DB_HOST"
    echo "  • Port: $DB_PORT"
    echo "  • Database: $DB_NAME"
    echo "  • User: $DB_USER"
    echo "  • Password: [Set]"
    echo
    
    if [ -f .env ]; then
        echo "Environment File:"
        echo "  • Location: $(pwd)/.env"
        echo "  • Telegram Token: $(grep "^TELEGRAM_BOT_TOKEN=" .env | cut -d'=' -f2 | sed 's/your_telegram_bot_token_here/[NOT SET]/')"
        echo "  • Ollama URL: $(grep "^OLLAMA_BASE_URL=" .env | cut -d'=' -f2)"
        echo "  • Application Port: $(grep "^PORT=" .env | cut -d'=' -f2)"
    fi
    echo "===================="
    echo
}

# Function to show next steps
show_next_steps() {
    show_configuration_summary
    
    print_success "🎉 Database setup completed successfully!"
    echo
    print_info "Next steps:"
    echo "1. 📋 Review your .env file configuration"
    
    # Check if Telegram token is set
    if [ -f .env ]; then
        telegram_token=$(grep "^TELEGRAM_BOT_TOKEN=" .env | cut -d'=' -f2)
        if [ "$telegram_token" = "your_telegram_bot_token_here" ] || [ -z "$telegram_token" ]; then
            echo "2. 🤖 Set your TELEGRAM_BOT_TOKEN in the .env file"
            echo "3. 📦 Install dependencies: npm install"
        else
            echo "2. 📦 Install dependencies: npm install"
        fi
    else
        echo "2. 📦 Install dependencies: npm install"
    fi
    
    echo "3. 🔨 Build the project: npm run build"
    echo "4. 🧪 Test database connection: npx tsx src/database/test.ts"
    echo "5. 🚀 Start the application: npm run dev"
    echo
    print_info "Useful commands:"
    echo "• 🔍 Test database: npx tsx src/database/test.ts"
    echo "• 🔄 Reset database: npx tsx -e \"import { DatabaseInitializer } from './src/database/init.js'; DatabaseInitializer.reset();\""
    echo "• 📊 View database status: npx tsx -e \"import { DatabaseInitializer } from './src/database/init.js'; DatabaseInitializer.getStatus().then(console.log);\""
    echo "• 📝 Edit .env file: nano .env"
    echo "• 🔧 Re-run this setup: ./setup-database.sh"
    echo
    
    # Final validation reminder
    if [ -f .env ]; then
        telegram_token=$(grep "^TELEGRAM_BOT_TOKEN=" .env | cut -d'=' -f2)
        if [ "$telegram_token" = "your_telegram_bot_token_here" ] || [ -z "$telegram_token" ]; then
            print_warning "⚠️  Don't forget to set your TELEGRAM_BOT_TOKEN in the .env file!"
        fi
    fi
    
    print_success "Setup complete! Your AI HR Bot is ready to configure."
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
                echo "Options:"
                echo "  --db-name NAME       Database name (default: hr_bot)"
                echo "  --db-user USER       Database user (default: hr_user)"
                echo "  --db-password PASS   Database password (will prompt if not provided)"
                echo "  --db-host HOST       Database host (default: localhost)"
                echo "  --db-port PORT       Database port (default: 5432)"
                echo "  --non-interactive    Run in non-interactive mode (skip all prompts)"
                echo "  --skip-prompts       Skip configuration prompts but allow .env editing"
                echo "  --help               Show this help message"
                echo
                echo "Examples:"
                echo "  $0                                           # Interactive setup"
                echo "  $0 --non-interactive --db-password secret   # Non-interactive setup"
                echo "  $0 --skip-prompts                          # Skip config prompts only"
                echo "  $0 --db-name my_hr_bot --db-user my_user   # Custom database settings"
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
    prompt_database_config
    create_database_and_user
    test_connection
    create_env_file
    prompt_edit_env_file
    show_next_steps
}

# Run main function
main "$@"
