# AI HR Bot - Docker Setup Guide

This guide explains how to run the AI HR Bot system using Docker and Docker Compose.

## 🏗️ Architecture Overview

The system consists of four main services:

1. **Database** (`database`) - PostgreSQL database
2. **Backend API** (`backend`) - Express.js API server
3. **Telegram Bot** (`bot`) - Telegram bot service
4. **Admin Panel** (`frontend`) - React/Preact frontend

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Ollama running locally (or configure to use external Ollama service)

## 🚀 Quick Start

### 1. Clone and Setup Environment

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd ai-hr-bot

# Copy environment configuration
cp env.example .env

# Edit .env file with your configuration
nano .env
```

### 2. Configure Environment Variables

Edit the `.env` file and set at minimum:

```env
# REQUIRED: Get from @BotFather on Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Database credentials
DB_PASSWORD=your_secure_password

# Ollama configuration (adjust if needed)
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=gemma3n:latest
```

### 3. Start the Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 4. Access the Services

- **Admin Panel**: http://localhost:3001
- **API Server**: http://localhost:3000
- **Database**: localhost:5432 (from host)

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from @BotFather | - | ✅ |
| `DB_PASSWORD` | PostgreSQL password | `hr_password` | ✅ |
| `OLLAMA_BASE_URL` | Ollama API endpoint | `http://host.docker.internal:11434` | ❌ |
| `OLLAMA_MODEL` | Ollama model name | `gemma3n:latest` | ❌ |
| `API_PORT` | Backend API port | `3000` | ❌ |
| `FRONTEND_PORT` | Frontend port | `3001` | ❌ |

### Docker Compose Profiles

You can run specific services:

```bash
# Run only database and backend
docker-compose up -d database backend

# Run without the Telegram bot
docker-compose up -d database backend frontend
```

## 🗄️ Database Management

### Initial Setup

The database is automatically initialized with:
- Required tables and indexes
- Sample vacancy data
- Proper constraints and triggers

### Database Access

```bash
# Connect to database
docker-compose exec database psql -U hr_user -d hr_bot

# View database logs
docker-compose logs database

# Backup database
docker-compose exec database pg_dump -U hr_user hr_bot > backup.sql

# Restore database
docker-compose exec -T database psql -U hr_user hr_bot < backup.sql
```

### Reset Database

```bash
# Stop services
docker-compose down

# Remove database volume
docker volume rm ai-hr-bot_postgres_data

# Restart services (will recreate database)
docker-compose up -d
```

## 🔍 Monitoring and Debugging

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f bot
docker-compose logs -f frontend
docker-compose logs -f database

# Last N lines
docker-compose logs --tail=100 backend
```

### Health Checks

```bash
# Check service health
docker-compose ps

# Manual health checks
curl http://localhost:3000/health    # Backend API
curl http://localhost:3001           # Frontend
```

### Service Management

```bash
# Restart a service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build backend

# Scale services (if needed)
docker-compose up -d --scale backend=2
```

## 🛠️ Development Mode

For development with hot-reload:

```bash
# Use development compose file
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Or set environment
NODE_ENV=development docker-compose up -d
```

## 🔒 Production Deployment

### Security Considerations

1. **Change Default Passwords**:
   ```env
   DB_PASSWORD=your_very_secure_password
   ```

2. **Use Secrets Management**:
   ```bash
   # Use Docker secrets or external secret management
   echo "your_bot_token" | docker secret create telegram_bot_token -
   ```

3. **Network Security**:
   ```yaml
   # In docker-compose.yml, remove port mappings for internal services
   # Only expose frontend and necessary API endpoints
   ```

4. **SSL/TLS**:
   ```bash
   # Use reverse proxy (nginx, traefik) for HTTPS
   # Configure SSL certificates
   ```

### Production Environment Variables

```env
NODE_ENV=production
LOG_LEVEL=warn
DB_SSL=true
CORS_ORIGIN_PROD=https://your-domain.com
```

## 🧹 Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Clean up everything
docker system prune -a --volumes
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   ```bash
   # Check if database is ready
   docker-compose logs database
   
   # Wait for database to be ready
   docker-compose up -d database
   sleep 30
   docker-compose up -d backend bot
   ```

2. **Ollama Connection Failed**:
   ```bash
   # Check Ollama is running
   curl http://localhost:11434/api/tags
   
   # For Docker Desktop (Windows/Mac)
   OLLAMA_BASE_URL=http://host.docker.internal:11434
   
   # For Linux
   OLLAMA_BASE_URL=http://172.17.0.1:11434
   ```

3. **Bot Not Responding**:
   ```bash
   # Check bot logs
   docker-compose logs bot
   
   # Verify token
   curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe
   ```

4. **Frontend Not Loading**:
   ```bash
   # Check nginx logs
   docker-compose logs frontend
   
   # Verify API connectivity
   curl http://localhost:3000/health
   ```

### Performance Tuning

```yaml
# In docker-compose.yml
services:
  database:
    command: >
      postgres
      -c shared_preload_libraries=pg_stat_statements
      -c max_connections=100
      -c shared_buffers=256MB
      -c effective_cache_size=1GB
      -c work_mem=4MB
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Telegram Bot API](https://core.telegram.org/bots/api)

## 🤝 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Ensure all required services are running
4. Check network connectivity between services
