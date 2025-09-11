# AI HR Bot System

A comprehensive AI-powered recruitment platform that combines a Telegram bot with a full-featured HR management system. Features PostgreSQL database integration, structured candidate evaluation, vacancy management, audio processing capabilities, and a modern admin panel.

## Features

### 🤖 Telegram Bot Interface
- **Vacancy Selection**: Interactive vacancy browsing and selection
- **Structured Interviews**: AI-powered conversations with configurable evaluation criteria
- **Audio Message Support**: Voice message processing with speech-to-text integration
- **Real-time Feedback**: Immediate candidate feedback and next steps guidance

### 🗄️ Database Integration
- **PostgreSQL Backend**: Robust data persistence with connection pooling
- **Candidate Management**: Complete candidate profiles and conversation history
- **Vacancy Management**: Structured job requirements and evaluation criteria
- **Evaluation Storage**: Comprehensive analysis results and recommendations

### 🧠 AI-Powered Analysis
- **Multi-LLM Support**: Ollama, Claude, OpenAI, and Azure integration
- **Structured Evaluation**: Technical skills, communication, and problem-solving assessment
- **Gap Analysis**: Identify skill gaps and provide specific improvement suggestions
- **Recommendation Engine**: Proceed/Reject/Clarify recommendations with confidence scores

### 📊 Admin Panel
- **Vacancy Management**: Create and manage job positions with detailed requirements
- **Candidate Dashboard**: Review evaluations, conversation history, and pipeline status
- **Analytics & Reporting**: Recruitment metrics, success rates, and performance insights
- **Real-time Monitoring**: Live system status and candidate activity tracking

## 🚀 Quick Start Guide

| Setup Type | Command | Access URL | Use Case |
|------------|---------|------------|----------|
| **Local Development** | `./docker-start.sh` | `http://localhost` | Testing & development |
| **Custom Domain** | [Domain Setup](#-custom-domain-setup) | `http://your-domain.com` | Production deployment |
| **HTTPS Production** | [SSL Setup](#sslhttps-setup) | `https://your-domain.com` | Secure production |

### Essential Configuration Steps

1. **Get Telegram Bot Token**: Message [@BotFather](https://t.me/botfather) on Telegram
2. **Configure Domain**: Copy `env.docker` to `.env` and set your `APP_DOMAIN` and `APP_PROTOCOL`
3. **Start Services**: Run `./docker-start.sh`
4. **Access Admin Panel**: Open your configured URL in browser

💡 **Need help?** See [Custom Domain Setup](#-custom-domain-setup) below or check [CUSTOM_DOMAIN_SETUP.md](./CUSTOM_DOMAIN_SETUP.md)

## Prerequisites

### For Local Development
- Node.js 18+ 
- PostgreSQL 15+ database server
- Ollama running locally with the `gemma3n:latest` model
- Telegram Bot Token (from @BotFather)

### For Docker Deployment
- Docker Engine 20.10+
- Docker Compose 2.0+
- Telegram Bot Token (from @BotFather)
- Ollama running locally or accessible remotely

## Installation

Choose one of the following installation methods:

### 🐳 Option 1: Docker Installation (Recommended)

The easiest way to get started is using Docker:

1. **Clone the repository:**
```bash
git clone <repository-url>
cd ai-hr-bot
```

2. **Quick Docker setup:**
```bash
# Use the automated Docker startup script
./docker-start.sh

# Or manually with docker-compose
cp env.example .env
# Edit .env with your TELEGRAM_BOT_TOKEN
docker-compose up -d
```

3. **Configure custom URL (optional):**
```bash
# Copy the Docker environment template
cp env.docker .env

# Edit .env to set your custom domain:
# APP_DOMAIN=your-domain.com (or your IP address)
# APP_PROTOCOL=http (or https for production)
# TELEGRAM_BOT_TOKEN=your_bot_token_here
```

4. **Access the services:**
- Admin Panel: http://localhost (port 80, configurable via FRONTEND_PORT)
- API Server: http://localhost:3000 (configurable via API_PORT)
- Database: localhost:5432

**Note**: The URLs will automatically adjust based on your `APP_DOMAIN` and `APP_PROTOCOL` settings in `.env`.

### 🌐 Custom Domain Setup

The AI HR Bot supports custom domains and URLs out of the box. Here's how to configure it:

#### Quick Domain Setup

1. **Copy the Docker environment template:**
   ```bash
   cp env.docker .env
   ```

2. **Configure your domain in `.env`:**
   ```env
   # Your custom domain or IP address
   APP_DOMAIN=your-domain.com
   
   # Protocol (http for development, https for production)
   APP_PROTOCOL=https
   
   # Required: Your Telegram bot token
   TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
   
   # Optional: Custom ports
   FRONTEND_PORT=80    # Admin panel port
   API_PORT=3000       # API server port
   ```

3. **Start the services:**
   ```bash
   ./docker-start.sh
   ```

#### Domain Setup Examples

**Local Development:**
```env
APP_DOMAIN=localhost
APP_PROTOCOL=http
FRONTEND_PORT=80
```
Access: `http://localhost`

**Production Domain:**
```env
APP_DOMAIN=hr-bot.mycompany.com
APP_PROTOCOL=https
FRONTEND_PORT=443
```
Access: `https://hr-bot.mycompany.com`

**Server IP Address:**
```env
APP_DOMAIN=192.168.1.100
APP_PROTOCOL=http
FRONTEND_PORT=8080
```
Access: `http://192.168.1.100:8080`

#### What Gets Configured Automatically

When you set your domain configuration, the system automatically handles:

- ✅ **CORS Origins**: Frontend ↔ Backend communication
- ✅ **API Base URLs**: All API endpoints use your domain
- ✅ **Nginx Configuration**: Accepts requests for your domain
- ✅ **Service Discovery**: Internal services find each other correctly

#### SSL/HTTPS Setup

For production HTTPS:

1. **Set HTTPS in your `.env`:**
   ```env
   APP_PROTOCOL=https
   FRONTEND_PORT=443
   ```

2. **Configure SSL certificates** using one of these methods:
   - **Reverse Proxy**: Use nginx/Apache with SSL certificates
   - **Cloud Service**: Use Cloudflare, AWS CloudFront, etc.
   - **Let's Encrypt**: Use certbot for free SSL certificates

3. **Example nginx reverse proxy config:**
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;
       
       ssl_certificate /path/to/certificate.crt;
       ssl_certificate_key /path/to/private.key;
       
       location / {
           proxy_pass http://localhost:80;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       
       location /api/ {
           proxy_pass http://localhost:3000/api/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

#### Troubleshooting Domain Setup

**CORS Errors:**
- Ensure `APP_DOMAIN` matches exactly what you type in the browser
- Check `APP_PROTOCOL` is correct (http vs https)
- Restart containers after changing `.env`: `docker-compose restart`

**Can't Access Application:**
- Check firewall settings for your ports
- Verify containers are running: `docker-compose ps`
- Check logs: `docker-compose logs frontend backend`

**API Not Found:**
- Test API directly: `curl http://your-domain:3000/health`
- Verify `API_PORT` is accessible from your network
- Check backend container health: `docker-compose ps backend`

For detailed domain setup instructions, see [CUSTOM_DOMAIN_SETUP.md](./CUSTOM_DOMAIN_SETUP.md).

For detailed Docker configuration, see [DOCKER.md](./DOCKER.md).

### 🔧 Option 2: Local Development Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd ai-hr-bot
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp env.example .env
# Edit .env with your actual values
```

4. **Build the project:**
```bash
npm run build
```

## Database Setup (Local Development Only)

> **Note**: Skip this section if you're using Docker installation - the database is automatically set up.

### Quick Setup (Recommended)
Use the automated setup script for the easiest experience:

```bash
# Run the database setup script
./setup-database.sh

# Or with custom parameters
./setup-database.sh --db-name my_hr_bot --db-user my_user
```

The script will:
- ✅ Check if PostgreSQL is installed and running
- ✅ Create the database and user
- ✅ Set up proper permissions
- ✅ Test the database connection
- ✅ Create the `.env` configuration file
- ✅ Provide next steps and useful commands

### Manual Setup
If you prefer to set up PostgreSQL manually:

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib

   # macOS with Homebrew
   brew install postgresql

   # Or use Docker
   docker run --name hr-bot-postgres -e POSTGRES_DB=hr_bot -e POSTGRES_USER=hr_user -e POSTGRES_PASSWORD=your_password -p 5432:5432 -d postgres:15
   ```

2. **Create Database and User**:
   ```sql
   CREATE DATABASE hr_bot;
   CREATE USER hr_user WITH ENCRYPTED PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE hr_bot TO hr_user;
   ```

## Configuration

Edit the `.env` file with your configuration:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hr_bot
DB_USER=hr_user
DB_PASSWORD=your_secure_password_here
DB_SSL=false
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3n:latest

# Perplexity API Configuration (Optional)
PERPLEXITY_API_KEY=your_perplexity_api_key_here
PERPLEXITY_MODEL=sonar-pro

# Application Configuration
PORT=3000
FRONTEND_PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# CORS Configuration
CORS_ORIGIN_DEV=http://localhost:5173,http://localhost:3001,http://localhost:3000
CORS_ORIGIN_PROD=https://your-admin-panel-domain.com
```

### Docker-specific Configuration

For Docker deployment, adjust these settings in your `.env` file:

```env
# Database - use Docker internal network
DB_HOST=database
DB_PORT=5432
DB_SSL=false

# Domain Configuration - IMPORTANT: Change these for your setup
# Your custom domain or IP address (e.g., your-domain.com or 192.168.1.100)
APP_DOMAIN=localhost
# Protocol (http for local, https for production with SSL)
APP_PROTOCOL=http

# Application settings
NODE_ENV=production
LOG_LEVEL=info
API_PORT=3000
FRONTEND_PORT=80

# Ollama configuration for Docker
# For Docker Desktop (Windows/Mac):
OLLAMA_BASE_URL=http://host.docker.internal:11434
# For Linux Docker:
# OLLAMA_BASE_URL=http://172.17.0.1:11434

# Bot-specific settings (required for bot container)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# CORS will be automatically configured based on APP_DOMAIN and APP_PROTOCOL
CORS_ORIGIN_PROD=http://localhost

# Optional: Perplexity API as backup
PERPLEXITY_API_KEY=your_perplexity_api_key_here
PERPLEXITY_MODEL=sonar-pro
```

### Bot-Specific Docker Notes

The bot service (`docker-compose.yml` → `bot` service) has these characteristics:
- **Dedicated Container**: Uses `Dockerfile.bot` for optimized bot-only deployment
- **Health Checks**: Monitors bot process health every 60 seconds
- **Restart Policy**: Automatically restarts on failure with `unless-stopped`
- **Resource Isolation**: Separate logs and uploads volumes from API server
- **Database Dependency**: Waits for database to be healthy before starting

## Usage

### Docker Usage

#### All Services
```bash
# Start all services
docker-compose up -d

# View logs from all services
docker-compose logs -f

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart backend
```

#### Bot-Specific Docker Commands
```bash
# Start only the bot service (requires database)
docker-compose up -d database bot

# View bot logs in real-time
docker-compose logs -f bot

# Restart only the bot
docker-compose restart bot

# Check bot health and status
docker-compose ps bot

# Execute commands in bot container
docker-compose exec bot node -e "console.log('Bot container is running')"

# Scale bot instances (if needed)
docker-compose up -d --scale bot=2
```

#### Bot Troubleshooting
```bash
# Check bot container status
docker-compose ps bot

# View recent bot logs
docker-compose logs --tail=50 bot

# Debug bot connectivity
docker-compose exec bot curl -f http://database:5432 || echo "Database not accessible"

# Restart bot with fresh container
docker-compose stop bot
docker-compose rm -f bot
docker-compose up -d bot
```

### Local Development

#### Development Mode with Hot Reload
```bash
# Start all services together
npm run dev

# Build and start production
npm run build
npm start
```

#### Start Specific Services

**Telegram Bot Only:**
```bash
npm run watch:bot
```
This command starts only the Telegram bot service with hot reload using nodemon. The bot will automatically restart when you make changes to the source code. This is ideal when you're developing bot-specific features and don't need the API server or admin panel running.

**API Server Only:**
```bash
npm run watch:server
```
Starts only the Express API server that handles admin panel requests and provides REST endpoints.

**Admin Panel Only:**
```bash
npm run watch:ui
```
Starts only the frontend admin panel in development mode with hot reload.

### Admin Panel Development
```bash
# Install admin panel dependencies
cd admin-panel
npm install

# Start admin panel in development mode
npm run dev

# Build admin panel for production
npm run build
```

### Bot Development & Deployment

#### Bot-Only Development
When working specifically on bot features, you can run just the bot service:

```bash
# Start only the Telegram bot with hot reload
npm run watch:bot
```

This is useful when:
- Developing conversation handlers and bot logic
- Testing bot responses and interactions
- Working on message processing and analysis features
- You don't need the admin panel or API server running

#### Bot Deployment Options

**Development Environment:**
```bash
# For development with automatic restarts
npm run watch:bot

# For one-time development run
npm run dev  # Starts both bot and API server
```

**Production Environment:**
```bash
# Build the application first
npm run build

# Start the bot in production
npm start  # This runs the compiled bot from dist/app.js

# Or use PM2 for process management
pm2 start dist/app.js --name "ai-hr-bot"
```

**Docker Deployment:**

*Full System (Recommended):*
```bash
# Deploy all services including bot, API server, database, and admin panel
docker-compose up -d

# Check bot status
docker-compose logs -f bot

# Restart only the bot service
docker-compose restart bot
```

*Bot-Only Container:*
```bash
# Build and run only the Telegram bot service
docker build -f Dockerfile.bot -t ai-hr-bot:bot .
docker run -d --name ai-hr-bot-telegram --env-file .env ai-hr-bot:bot

# View bot logs
docker logs -f ai-hr-bot-telegram

# Stop/start bot container
docker stop ai-hr-bot-telegram
docker start ai-hr-bot-telegram
```

*Selective Service Deployment:*
```bash
# Run only database and bot (without API server and admin panel)
docker-compose up -d database bot

# Run everything except bot (for testing API/admin panel)
docker-compose up -d database backend frontend
```

#### Bot Configuration

Make sure your `.env` file contains the required bot configuration:

```env
# Required for bot operation
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Database connection (required for candidate data)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hr_bot
DB_USER=hr_user
DB_PASSWORD=your_secure_password_here

# AI/LLM Configuration (required for analysis)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3n:latest

# Optional: Alternative AI providers
PERPLEXITY_API_KEY=your_perplexity_api_key_here
PERPLEXITY_MODEL=sonar-pro
```

### Bot Commands

- `/start` - Initialize the bot and get welcome message
- `/help` - Show help information and usage instructions
- `/clear` - Clear conversation history

### Resume Analysis

Send a message in the following format:
```
Вакансия: [Job description here]
Резюме: [Resume text here]
```

The bot will analyze the resume against the job requirements and provide:
- Key job requirements
- Candidate skills
- Matches and gaps
- Interview questions

### Interview Mode

Simply send any message (not in resume format) to start an interactive interview conversation. The bot will:
- Analyze your responses
- Provide feedback
- Ask follow-up questions
- Maintain conversation context

## Project Structure

```
ai-hr-bot/
├── src/                          # Backend source code
│   ├── app.ts                   # Telegram bot entry point
│   ├── server.ts                # API server entry point
│   ├── bot/
│   │   └── handlers.ts          # Telegram bot message handlers
│   ├── config/
│   │   └── environment.ts       # Environment configuration
│   ├── database/
│   │   ├── connection.ts        # PostgreSQL connection pooling
│   │   ├── schema.ts            # Database schema definitions
│   │   ├── init.ts              # Database initialization
│   │   └── migrations/          # Database migration files
│   ├── repositories/            # Data access layer
│   ├── routes/                  # API route handlers
│   ├── services/                # Business logic services
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Utility functions
├── admin-panel/                 # Frontend admin panel
│   ├── src/
│   │   ├── components/          # React/Preact components
│   │   ├── pages/               # Application pages
│   │   ├── services/            # API service layer
│   │   └── types/               # Frontend type definitions
│   ├── package.json             # Frontend dependencies
│   └── Dockerfile               # Frontend Docker build
├── docker/                      # Docker configuration
│   └── init-db.sql             # Database initialization SQL
├── uploads/                     # File upload storage
├── setup-database.sh           # Database setup script
├── docker-start.sh             # Docker startup script
├── docker-compose.yml          # Docker services configuration
├── env.example                 # Environment template
├── Dockerfile                  # Backend Docker build
├── Dockerfile.bot              # Bot Docker build
├── DOCKER.md                   # Docker documentation
└── README.md                   # This file
```

## Development

### Available Scripts

#### Backend Scripts
- `npm run dev` - Start development server with hot reload (both bot and API server)
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server (bot only)
- `npm run clean` - Clean build directory
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run watch:bot` - **Watch bot service only with hot reload**
- `npm run watch:server` - Watch API server only with hot reload

#### Frontend Scripts
- `npm run build:ui` - Build admin panel
- `npm run lint:ui` - Lint admin panel code
- `npm run format:ui` - Format admin panel code
- `npm run watch:ui` - Start admin panel development server

#### Docker Scripts
- `./docker-start.sh` - Start all services with Docker
- `./docker-start.sh --logs` - Start services and show logs
- `./setup-database.sh` - Set up local PostgreSQL database

#### Bot Development Scripts
- `npm run watch:bot` - **Start bot with hot reload (recommended for bot development)**
- `npm run dev` - Start both bot and API server with hot reload
- `npm run build && npm start` - Build and run bot in production mode

#### Docker Bot Commands (Quick Reference)
- `docker-compose up -d bot` - Start bot service only (with database)
- `docker-compose logs -f bot` - View bot logs in real-time
- `docker-compose restart bot` - Restart bot service
- `./docker-start.sh` - **Start all services with automated setup**

### Testing

#### Database Testing
Test the database connection and schema:
```bash
# Run database connection tests
npx tsx src/database/test.ts

# Or run specific test functions
npx tsx -e "import { testDatabaseConnection } from './src/database/test.js'; testDatabaseConnection();"
```

#### Development Testing
```bash
# Run the application in development mode
npm run dev

# The application will automatically initialize the database on startup
# Check console logs for database connection status
```

### Code Style

The project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Modular architecture with dependency injection

## Deployment

This section provides comprehensive deployment instructions for different environments and scenarios.

### 🐳 Docker Deployment (Recommended)

Docker deployment is the easiest and most reliable method for production environments.

#### Quick Start

1. **Clone and prepare the environment:**
```bash
git clone <repository-url>
cd ai-hr-bot
cp env.example .env
```

2. **Configure environment variables:**
Edit `.env` file with your production values:
```env
# Required: Telegram Bot Token
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Database (Docker internal)
DB_HOST=database
DB_NAME=hr_bot
DB_USER=hr_user
DB_PASSWORD=your_secure_password_here

# Ollama Configuration
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=gemma3n:latest

# Production settings
NODE_ENV=production
LOG_LEVEL=info

# CORS for production
CORS_ORIGIN_PROD=https://your-domain.com
```

3. **Deploy with automated script:**
```bash
# Use the automated Docker startup script
./docker-start.sh

# Or start manually
docker-compose up -d
```

4. **Verify deployment:**
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Test endpoints
curl http://localhost:3000/api/health
curl http://localhost:3001  # Admin panel
```

#### Production Environment Setup

For production deployments, consider these additional steps:

1. **SSL/TLS Configuration:**
```bash
# Add SSL certificates to nginx.conf in admin-panel/
# Update CORS_ORIGIN_PROD with your HTTPS domain
```

2. **Resource Limits:**
```yaml
# Add to docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          memory: 1G
```

3. **Health Checks:**
```yaml
# Already configured in docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

#### Docker Commands Reference

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart specific service
docker-compose restart backend

# View logs
docker-compose logs -f [service-name]

# Scale services
docker-compose up -d --scale backend=2

# Update and redeploy
git pull
docker-compose build
docker-compose up -d

# Database backup
docker-compose exec database pg_dump -U hr_user hr_bot > backup.sql

# Database restore
docker-compose exec -T database psql -U hr_user hr_bot < backup.sql
```

### 🖥️ VPS/Server Deployment

For deployment on a VPS or dedicated server:

#### Prerequisites

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

#### Deployment Steps

1. **Server preparation:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y git curl wget nginx certbot python3-certbot-nginx

# Create application directory
sudo mkdir -p /opt/ai-hr-bot
sudo chown $USER:$USER /opt/ai-hr-bot
cd /opt/ai-hr-bot
```

2. **Clone and configure:**
```bash
git clone <repository-url> .
cp env.example .env
nano .env  # Edit with production values
```

3. **Set up reverse proxy (optional):**
```nginx
# /etc/nginx/sites-available/ai-hr-bot
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ai-hr-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

4. **Deploy and start:**
```bash
./docker-start.sh
```

5. **Set up system service (optional):**
```bash
# Create systemd service
sudo tee /etc/systemd/system/ai-hr-bot.service > /dev/null <<EOF
[Unit]
Description=AI HR Bot
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/ai-hr-bot
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable ai-hr-bot
sudo systemctl start ai-hr-bot
```

### ☁️ Cloud Platform Deployment

#### AWS EC2

1. **Launch EC2 instance:**
   - Instance type: t3.medium or larger
   - Security groups: Allow ports 22, 80, 443, 3000, 3001
   - Storage: At least 20GB

2. **Install Docker and deploy:**
```bash
# Connect to instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker
sudo apt update
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Deploy application
git clone <repository-url>
cd ai-hr-bot
cp env.example .env
# Edit .env with production values
./docker-start.sh
```

#### DigitalOcean Droplet

1. **Create droplet:**
   - Image: Docker on Ubuntu
   - Size: 2GB RAM minimum
   - Add SSH keys

2. **Deploy:**
```bash
ssh root@your-droplet-ip
git clone <repository-url>
cd ai-hr-bot
cp env.example .env
# Configure .env
./docker-start.sh
```

#### Google Cloud Platform

1. **Create VM instance:**
```bash
gcloud compute instances create ai-hr-bot \
    --zone=us-central1-a \
    --machine-type=e2-standard-2 \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=20GB
```

2. **Deploy application:**
```bash
gcloud compute ssh ai-hr-bot --zone=us-central1-a
# Follow standard deployment steps
```

### 🔧 Manual/Traditional Deployment

For deployment without Docker:

#### Prerequisites

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install PM2 for process management
npm install -g pm2
```

#### Deployment Steps

1. **Prepare application:**
```bash
git clone <repository-url>
cd ai-hr-bot
npm install
npm run build

# Build admin panel
cd admin-panel
npm install
npm run build
cd ..
```

2. **Set up database:**
```bash
./setup-database.sh
```

3. **Configure environment:**
```bash
cp env.example .env
# Edit .env with production values
```

4. **Start with PM2:**
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'ai-hr-bot-server',
      script: 'dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'ai-hr-bot-telegram',
      script: 'dist/app.js',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      },
      // Bot-specific configuration
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

# For bot-only deployment, you can also use:
# pm2 start dist/app.js --name "ai-hr-bot" --restart-delay=5000

# Start applications
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

5. **Set up web server:**
```bash
# Install and configure nginx
sudo apt install nginx
# Configure nginx to serve admin panel and proxy API
# (See VPS deployment section for nginx config)
```

### 📊 Monitoring and Maintenance

#### Health Monitoring

```bash
# Check service health
curl http://localhost:3000/api/health

# Monitor Docker services
docker-compose ps
docker stats

# Monitor with PM2
pm2 status
pm2 logs
pm2 monit
```

#### Backup Strategies

```bash
# Database backup
docker-compose exec database pg_dump -U hr_user hr_bot > backup_$(date +%Y%m%d).sql

# Full application backup
tar -czf ai-hr-bot-backup-$(date +%Y%m%d).tar.gz \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=admin-panel/node_modules \
    --exclude=admin-panel/dist \
    /opt/ai-hr-bot
```

#### Log Management

```bash
# Docker logs
docker-compose logs --tail=100 -f

# Log rotation setup
sudo tee /etc/logrotate.d/ai-hr-bot > /dev/null <<EOF
/opt/ai-hr-bot/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    copytruncate
}
EOF
```

#### Updates and Maintenance

```bash
# Update application
git pull
docker-compose build
docker-compose up -d

# Database migrations
npm run migrate

# Security updates
sudo apt update && sudo apt upgrade -y
docker system prune -f
```

### 🚨 Troubleshooting Deployment

#### Common Issues

1. **Port conflicts:**
```bash
# Check port usage
sudo netstat -tlnp | grep :3000
sudo lsof -i :3000

# Kill conflicting processes
sudo kill -9 $(sudo lsof -t -i:3000)
```

2. **Database connection issues:**
```bash
# Test database connectivity
docker-compose exec database psql -U hr_user -d hr_bot -c "SELECT version();"

# Check database logs
docker-compose logs database
```

3. **Memory issues:**
```bash
# Monitor resource usage
docker stats
free -h
df -h

# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

4. **SSL/HTTPS issues:**
```bash
# Test SSL certificate
openssl s_client -connect your-domain.com:443

# Renew Let's Encrypt certificate
sudo certbot renew --dry-run
```

#### Performance Optimization

```bash
# Enable Docker BuildKit
export DOCKER_BUILDKIT=1

# Optimize Docker images
docker system prune -a

# Monitor application performance
pm2 monit  # For PM2 deployments
docker stats  # For Docker deployments
```

For additional deployment guidance and platform-specific instructions, see [DOCKER.md](./DOCKER.md).

## Troubleshooting

### Common Issues

1. **Bot not responding**: Check if your Telegram bot token is correct
2. **Database connection failed**: Verify PostgreSQL is running and credentials are correct
3. **Ollama connection errors**: Ensure Ollama is running on the specified URL
4. **Model not found**: Make sure the specified model is available in Ollama
5. **Database schema errors**: Run database tests to verify schema integrity

### Database Issues

**Connection Problems:**
```bash
# Test database connection
npx tsx -e "import { testDatabaseConnection } from './src/database/test.js'; testDatabaseConnection();"
```

**Schema Issues:**
```bash
# Reset and reinitialize database
npx tsx -e "import { DatabaseInitializer } from './src/database/init.js'; DatabaseInitializer.reset();"
```

**Permission Errors:**
- Ensure the database user has proper permissions
- Check PostgreSQL logs for authentication failures
- Verify database server is accepting connections

### Logs

The application provides detailed logging. Check console output for:
- Database connection status and pool statistics
- Schema initialization progress
- Message processing logs
- Error details with stack traces
- Performance metrics and query execution times

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Author

**Alexander Gerasimov**
- Website: [agrsmv.ru](https://agrsmv.ru)
- Telegram: [@geralex](https://t.me/geralex)

## License

MIT License - see LICENSE file for details
