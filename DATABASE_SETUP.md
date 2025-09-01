# Database Setup Guide

This guide explains how to set up the PostgreSQL database for the HR Bot system.

## Quick Start with Docker (Recommended)

### Option A: Docker Compose (if installed)

```bash
# Check if Docker Compose is available
docker-compose --version

# Start PostgreSQL database
docker-compose up -d postgres

# Wait for database to be ready (about 10-15 seconds)
docker-compose logs -f postgres

# Test the connection
npm run db:test
```

### Option B: Docker without Compose

If Docker Compose isn't installed, you can use plain Docker:

```bash
# Create a network for the containers
docker network create hr-bot-network

# Start PostgreSQL container
docker run -d \
  --name hr-bot-postgres \
  --network hr-bot-network \
  -e POSTGRES_DB=hr_bot \
  -e POSTGRES_USER=hr_user \
  -e POSTGRES_PASSWORD=hr_password \
  -p 5432:5432 \
  -v hr_bot_data:/var/lib/postgresql/data \
  postgres:15-alpine

# Wait for PostgreSQL to be ready
docker exec hr-bot-postgres pg_isready -U hr_user -d hr_bot

# Initialize schema
docker exec -i hr-bot-postgres psql -U hr_user -d hr_bot < src/database/schema.sql

# Test the connection
npm run db:test
```

### Option C: Install Docker Compose

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install docker-compose

# Or install Docker Compose V2 (recommended)
sudo apt update && sudo apt install docker-compose-plugin

# Then use 'docker compose' (note the space) instead of 'docker-compose'
docker compose up -d postgres
```

## Manual Setup

### Prerequisites

- PostgreSQL 12+ installed and running
- Node.js 18+ and npm
- `psql` command-line tool available

### Option 1: Automated Setup Script

Use the provided initialization script:

```bash
# Basic setup with default values
npm run db:init

# Custom configuration
./scripts/init-db.sh --host localhost --port 5432 --dbname hr_bot --user hr_user --password mypassword

# Skip database creation (if already exists)
npm run db:reset
```

### Option 2: Manual Setup

1. **Create Database and User**:
```sql
-- Connect as postgres superuser
sudo -u postgres psql

-- Create database
CREATE DATABASE hr_bot;

-- Create user
CREATE USER hr_user WITH PASSWORD 'your_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hr_bot TO hr_user;
\c hr_bot
GRANT ALL ON SCHEMA public TO hr_user;
```

2. **Run Database Schema**:
```bash
# Set environment variables
export DB_PASSWORD=your_password_here

# Run schema
psql -h localhost -U hr_user -d hr_bot -f src/database/schema.sql
```

3. **Test Connection**:
```bash
npm run db:test
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hr_bot
DB_USER=hr_user
DB_PASSWORD=your_password_here
DB_SSL=false
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

# Other configuration...
TELEGRAM_BOT_TOKEN=your_bot_token
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3n:latest
```

### Database Schema

The database includes the following tables:

- **`vacancies`**: Job vacancy definitions with requirements and evaluation criteria
- **`candidates`**: Telegram user information and candidate profiles
- **`dialogues`**: Conversation history between candidates and the bot
- **`evaluations`**: AI-generated candidate evaluations and scores

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run db:init` | Initialize database with default settings |
| `npm run db:reset` | Reset schema without recreating database/user |
| `npm run db:test` | Test database connection and run validation |
| `npm run db:init:docker` | Initialize database in Docker environment |

## Docker Compose Services

### PostgreSQL Database
```bash
# Start only PostgreSQL
docker-compose up -d postgres

# View logs
docker-compose logs -f postgres

# Stop database
docker-compose down
```

### pgAdmin (Optional)
```bash
# Start PostgreSQL + pgAdmin
docker-compose --profile admin up -d

# Access pgAdmin at http://localhost:8080
# Email: admin@hrbot.local
# Password: admin
```

## Troubleshooting

### Connection Issues

1. **PostgreSQL not running**:
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Start PostgreSQL (Ubuntu/Debian)
sudo systemctl start postgresql

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql
```

2. **Authentication failed**:
- Verify username and password in `.env`
- Check PostgreSQL `pg_hba.conf` configuration
- Ensure user has proper privileges

3. **Database doesn't exist**:
```bash
# Recreate database
npm run db:init
```

### Schema Issues

1. **Tables not created**:
```bash
# Check if schema file exists
ls -la src/database/schema.sql

# Manually run schema
psql -h localhost -U hr_user -d hr_bot -f src/database/schema.sql
```

2. **Permission denied**:
```bash
# Grant all privileges to user
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hr_bot TO hr_user;"
sudo -u postgres psql -d hr_bot -c "GRANT ALL ON SCHEMA public TO hr_user;"
```

### Docker Issues

1. **Port already in use**:
```bash
# Check what's using port 5432
sudo lsof -i :5432

# Use different port in docker-compose.yml
ports:
  - "5433:5432"
```

2. **Container won't start**:
```bash
# Check container logs
docker-compose logs postgres

# Remove old containers and volumes
docker-compose down -v
docker-compose up -d postgres
```

## Database Management

### Backup and Restore

```bash
# Backup database
pg_dump -h localhost -U hr_user hr_bot > backup.sql

# Restore database
psql -h localhost -U hr_user hr_bot < backup.sql
```

### Reset Database

```bash
# Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS hr_bot;"
npm run db:init
```

### View Database Status

```bash
# Run comprehensive database test
npm run db:test

# Check table structure
psql -h localhost -U hr_user -d hr_bot -c "\dt"

# Check sample data
psql -h localhost -U hr_user -d hr_bot -c "SELECT title, status FROM vacancies;"
```

## Production Considerations

1. **Security**:
   - Use strong passwords
   - Enable SSL connections (`DB_SSL=true`)
   - Restrict database access by IP
   - Use connection pooling limits

2. **Performance**:
   - Adjust `DB_MAX_CONNECTIONS` based on load
   - Monitor connection pool usage
   - Add database indexes for frequently queried columns

3. **Monitoring**:
   - Enable PostgreSQL logging
   - Monitor connection counts
   - Set up health checks

4. **Backup**:
   - Schedule regular database backups
   - Test backup restoration procedures
   - Consider point-in-time recovery setup