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

3. **Access the services:**
- Admin Panel: http://localhost:3001
- API Server: http://localhost:3000
- Database: localhost:5432

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
# Use Docker internal network
DB_HOST=database
OLLAMA_BASE_URL=http://host.docker.internal:11434
NODE_ENV=production
```

## Usage

### Docker Usage
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart a specific service
docker-compose restart backend
```

### Local Development
```bash
# Development mode with hot reload
npm run dev

# Build and start production
npm run build
npm start

# Start specific services
npm run watch:bot    # Bot service only
npm run watch:server # API server only
npm run watch:ui     # Admin panel only
```

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
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run clean` - Clean build directory
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run watch:bot` - Watch bot service only
- `npm run watch:server` - Watch API server only

#### Frontend Scripts
- `npm run build:ui` - Build admin panel
- `npm run lint:ui` - Lint admin panel code
- `npm run format:ui` - Format admin panel code
- `npm run watch:ui` - Start admin panel development server

#### Docker Scripts
- `./docker-start.sh` - Start all services with Docker
- `./docker-start.sh --logs` - Start services and show logs
- `./setup-database.sh` - Set up local PostgreSQL database

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
      }
    }
  ]
};
EOF

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
