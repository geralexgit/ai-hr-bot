#!/bin/bash

# AI HR Bot - Docker Startup Script
# This script helps you start the AI HR Bot system with Docker

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

# Function to check if Docker is installed
check_docker() {
    print_info "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        print_info "Please install Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed"
        print_info "Please install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Function to check if Docker is running
check_docker_running() {
    print_info "Checking if Docker is running..."
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running"
        print_info "Please start Docker and try again"
        exit 1
    fi
    
    print_success "Docker is running"
}

# Function to check environment file
check_env_file() {
    print_info "Checking environment configuration..."
    
    if [ ! -f .env ]; then
        print_warning ".env file not found"
        if [ -f env.example ]; then
            print_info "Copying env.example to .env..."
            cp env.example .env
            print_warning "Please edit .env file and set your TELEGRAM_BOT_TOKEN"
            print_info "You can edit it now with: nano .env"
            read -p "Press Enter to continue after editing .env file..."
        else
            print_error "No environment configuration found"
            print_info "Please create a .env file with required variables"
            exit 1
        fi
    fi
    
    # Check for required variables
    if ! grep -q "TELEGRAM_BOT_TOKEN=" .env || grep -q "TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here" .env; then
        print_warning "TELEGRAM_BOT_TOKEN is not set in .env file"
        print_info "Please set your Telegram bot token in .env file"
        read -p "Press Enter to continue after setting the token..."
    fi
    
    print_success "Environment configuration checked"
}

# Function to check Ollama
check_ollama() {
    print_info "Checking Ollama availability..."
    
    # Check if Ollama is running locally
    if curl -s http://localhost:11434/api/tags &> /dev/null; then
        print_success "Ollama is running locally on port 11434"
    else
        print_warning "Ollama is not running locally"
        print_info "The bot will try to connect to Ollama as configured in .env"
        print_info "Make sure Ollama is running or update OLLAMA_BASE_URL in .env"
    fi
}

# Function to build and start services
start_services() {
    print_info "Building and starting services..."
    
    # Build images
    print_info "Building Docker images..."
    docker-compose build
    
    # Start services
    print_info "Starting services..."
    docker-compose up -d
    
    print_success "Services started"
}

# Function to wait for services to be ready
wait_for_services() {
    print_info "Waiting for services to be ready..."
    
    # Wait for database
    print_info "Waiting for database..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose exec -T database pg_isready -U hr_user -d hr_bot &> /dev/null; then
            print_success "Database is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "Database failed to start within 60 seconds"
        docker-compose logs database
        exit 1
    fi
    
    # Wait for backend API
    print_info "Waiting for backend API..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -s http://localhost:3000/health &> /dev/null; then
            print_success "Backend API is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_warning "Backend API is not responding (this might be normal if it's still starting)"
    fi
    
    # Wait for frontend
    print_info "Waiting for frontend..."
    timeout=30
    while [ $timeout -gt 0 ]; do
        if curl -s http://localhost:3001 &> /dev/null; then
            print_success "Frontend is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_warning "Frontend is not responding (this might be normal if it's still starting)"
    fi
}

# Function to show service status
show_status() {
    print_info "Service Status:"
    docker-compose ps
    echo
    
    print_info "Service URLs:"
    echo "• Admin Panel: http://localhost:3001"
    echo "• API Server: http://localhost:3000"
    echo "• API Health: http://localhost:3000/health"
    echo
    
    print_info "Useful Commands:"
    echo "• View logs: docker-compose logs -f"
    echo "• Stop services: docker-compose down"
    echo "• Restart services: docker-compose restart"
    echo "• View database: docker-compose exec database psql -U hr_user -d hr_bot"
}

# Function to show logs
show_logs() {
    print_info "Recent logs from all services:"
    docker-compose logs --tail=20
    echo
    print_info "To follow logs in real-time, run: docker-compose logs -f"
}

# Main function
main() {
    echo
    print_info "🚀 AI HR Bot - Docker Startup"
    echo "==============================="
    echo
    
    # Parse command line arguments
    SHOW_LOGS=false
    SKIP_CHECKS=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --logs)
                SHOW_LOGS=true
                shift
                ;;
            --skip-checks)
                SKIP_CHECKS=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo
                echo "Options:"
                echo "  --logs         Show logs after startup"
                echo "  --skip-checks  Skip pre-startup checks"
                echo "  --help         Show this help message"
                echo
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    if [ "$SKIP_CHECKS" = false ]; then
        check_docker
        check_docker_running
        check_env_file
        check_ollama
    fi
    
    start_services
    wait_for_services
    show_status
    
    if [ "$SHOW_LOGS" = true ]; then
        echo
        show_logs
    fi
    
    echo
    print_success "🎉 AI HR Bot is running!"
    print_info "Check the admin panel at: http://localhost:3001"
}

# Run main function
main "$@"
