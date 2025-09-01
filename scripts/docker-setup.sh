#!/bin/bash

# Docker Setup Script for HR Bot Database
# This script provides multiple ways to set up PostgreSQL using Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        print_status "Please install Docker first: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        print_status "Please start Docker daemon first"
        exit 1
    fi
    
    print_success "Docker is available"
}

# Check if Docker Compose is available
check_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose (legacy) is available"
        return 0
    elif docker compose version &> /dev/null; then
        print_success "Docker Compose V2 is available"
        return 0
    else
        print_warning "Docker Compose is not available"
        return 1
    fi
}

# Setup using Docker Compose
setup_with_compose() {
    print_status "Setting up database with Docker Compose..."
    
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    # Start PostgreSQL
    print_status "Starting PostgreSQL container..."
    $COMPOSE_CMD up -d postgres
    
    # Wait for database to be ready
    print_status "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if $COMPOSE_CMD exec postgres pg_isready -U hr_user -d hr_bot &> /dev/null; then
            print_success "PostgreSQL is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "PostgreSQL failed to start within 30 seconds"
            $COMPOSE_CMD logs postgres
            exit 1
        fi
        sleep 1
    done
    
    print_success "Database setup completed with Docker Compose"
    print_status "You can now run: npm run db:test"
}

# Setup using plain Docker
setup_with_docker() {
    print_status "Setting up database with plain Docker..."
    
    # Create network if it doesn't exist
    if ! docker network ls | grep -q hr-bot-network; then
        print_status "Creating Docker network..."
        docker network create hr-bot-network
    fi
    
    # Stop and remove existing container if it exists
    if docker ps -a | grep -q hr-bot-postgres; then
        print_status "Removing existing PostgreSQL container..."
        docker stop hr-bot-postgres &> /dev/null || true
        docker rm hr-bot-postgres &> /dev/null || true
    fi
    
    # Start PostgreSQL container
    print_status "Starting PostgreSQL container..."
    docker run -d \
        --name hr-bot-postgres \
        --network hr-bot-network \
        -e POSTGRES_DB=hr_bot \
        -e POSTGRES_USER=hr_user \
        -e POSTGRES_PASSWORD=hr_password \
        -e POSTGRES_INITDB_ARGS="--auth-host=scram-sha-256 --auth-local=scram-sha-256" \
        -p 5432:5432 \
        -v hr_bot_data:/var/lib/postgresql/data \
        postgres:15-alpine
    
    # Wait for PostgreSQL to be ready
    print_status "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if docker exec hr-bot-postgres pg_isready -U hr_user -d hr_bot &> /dev/null; then
            print_success "PostgreSQL is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "PostgreSQL failed to start within 30 seconds"
            docker logs hr-bot-postgres
            exit 1
        fi
        sleep 1
    done
    
    # Initialize schema
    if [ -f "src/database/schema.sql" ]; then
        print_status "Initializing database schema..."
        docker exec -i hr-bot-postgres psql -U hr_user -d hr_bot < src/database/schema.sql
        print_success "Database schema initialized"
    else
        print_warning "Schema file not found, skipping initialization"
    fi
    
    print_success "Database setup completed with Docker"
    print_status "You can now run: npm run db:test"
}

# Install Docker Compose
install_docker_compose() {
    print_status "Installing Docker Compose..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt &> /dev/null; then
            # Ubuntu/Debian
            print_status "Installing Docker Compose via apt..."
            sudo apt update
            sudo apt install -y docker-compose-plugin
        elif command -v yum &> /dev/null; then
            # CentOS/RHEL
            print_status "Installing Docker Compose via yum..."
            sudo yum install -y docker-compose-plugin
        else
            # Generic Linux - download binary
            print_status "Installing Docker Compose binary..."
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            print_status "Installing Docker Compose via Homebrew..."
            brew install docker-compose
        else
            print_error "Homebrew not found. Please install Docker Desktop for Mac which includes Docker Compose"
            exit 1
        fi
    else
        print_error "Unsupported operating system: $OSTYPE"
        print_status "Please install Docker Compose manually: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_success "Docker Compose installation completed"
}

# Show status of containers
show_status() {
    print_status "Docker container status:"
    
    if docker ps | grep -q hr-bot-postgres; then
        print_success "PostgreSQL container is running"
        docker ps --filter "name=hr-bot-postgres" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        print_warning "PostgreSQL container is not running"
    fi
    
    echo ""
    print_status "Available commands:"
    echo "  docker logs hr-bot-postgres          # View PostgreSQL logs"
    echo "  docker exec -it hr-bot-postgres psql -U hr_user -d hr_bot  # Connect to database"
    echo "  docker stop hr-bot-postgres          # Stop database"
    echo "  docker start hr-bot-postgres         # Start database"
}

# Cleanup containers and volumes
cleanup() {
    print_status "Cleaning up Docker resources..."
    
    # Stop and remove containers
    docker stop hr-bot-postgres &> /dev/null || true
    docker rm hr-bot-postgres &> /dev/null || true
    
    # Remove volumes (optional)
    if [ "$1" = "--volumes" ]; then
        docker volume rm hr_bot_data &> /dev/null || true
        print_status "Removed data volumes"
    fi
    
    # Remove network
    docker network rm hr-bot-network &> /dev/null || true
    
    print_success "Cleanup completed"
}

# Show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup                   Auto-detect and setup database (default)"
    echo "  compose                 Setup using Docker Compose"
    echo "  docker                  Setup using plain Docker"
    echo "  install-compose         Install Docker Compose"
    echo "  status                  Show container status"
    echo "  cleanup [--volumes]     Stop and remove containers"
    echo "  help                    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                      # Auto-setup (tries Compose first, falls back to Docker)"
    echo "  $0 docker               # Force plain Docker setup"
    echo "  $0 cleanup --volumes    # Remove everything including data"
}

# Main function
main() {
    local command=${1:-setup}
    
    case $command in
        setup)
            echo "🐳 HR Bot Docker Database Setup"
            echo "==============================="
            echo ""
            
            check_docker
            
            if check_docker_compose; then
                setup_with_compose
            else
                print_warning "Docker Compose not available, using plain Docker"
                setup_with_docker
            fi
            ;;
        compose)
            check_docker
            if check_docker_compose; then
                setup_with_compose
            else
                print_error "Docker Compose is not available"
                print_status "Run '$0 install-compose' to install it, or use '$0 docker' for plain Docker setup"
                exit 1
            fi
            ;;
        docker)
            check_docker
            setup_with_docker
            ;;
        install-compose)
            install_docker_compose
            ;;
        status)
            show_status
            ;;
        cleanup)
            cleanup $2
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            print_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"