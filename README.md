# AI HR Bot System

A comprehensive AI-powered recruitment platform that transforms the basic Telegram bot into a full-featured HR system with PostgreSQL database integration, structured candidate evaluation, vacancy management, audio processing capabilities, and an admin panel.

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

### 📊 Admin Panel (Upcoming)
- **Vacancy Management**: Create and manage job positions with detailed requirements
- **Candidate Dashboard**: Review evaluations, conversation history, and pipeline status
- **Analytics & Reporting**: Recruitment metrics, success rates, and performance insights
- **Real-time Monitoring**: Live system status and candidate activity tracking

## Prerequisites

- Node.js 18+
- PostgreSQL 15+ database server
- Ollama running locally with the `gemma3n:latest` model
- Telegram Bot Token (from @BotFather)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd telegram-hr-bot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual values
```

4. Build the project:
```bash
npm run build
```

## Database Setup

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
DB_CONNECTION_TIMEOUT=2000

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3n:latest

# Application Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
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
src/
├── app.ts                 # Main application entry point
├── bot/
│   └── handlers.ts        # Telegram bot message handlers
├── config/
│   └── environment.ts     # Environment configuration
├── database/
│   ├── index.ts           # Database module exports
│   ├── connection.ts      # PostgreSQL connection pooling
│   ├── schema.ts          # Database schema and migrations
│   ├── init.ts            # Database initialization
│   └── test.ts            # Database testing utilities
├── services/
│   ├── conversation.service.ts  # Conversation management
│   └── ollama.service.ts        # Ollama API integration
├── types/
│   └── index.ts           # TypeScript type definitions
└── utils/
    └── logger.ts          # Logging utility
setup-database.sh          # Automated database setup script
.env.example              # Environment configuration template
```

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run clean` - Clean build directory
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

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

1. Build the project:
```bash
npm run build
```

2. Set production environment variables
3. Start the application:
```bash
npm start
```

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

## License

MIT License - see LICENSE file for details
