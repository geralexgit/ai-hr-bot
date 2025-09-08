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

### Docker Deployment (Recommended)

1. **Prepare environment:**
```bash
cp env.example .env
# Edit .env with production values
```

2. **Deploy with Docker Compose:**
```bash
# Start all services in production mode
NODE_ENV=production docker-compose up -d

# Check service health
docker-compose ps
```

3. **Monitor services:**
```bash
# View logs
docker-compose logs -f

# Check specific service
docker-compose logs backend
```

### Manual Deployment

1. **Build the project:**
```bash
npm run build
npm run build:ui
```

2. **Set production environment variables**
3. **Start the application:**
```bash
npm start
```

For detailed deployment instructions, see [DOCKER.md](./DOCKER.md).

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
