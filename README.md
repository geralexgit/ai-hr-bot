# Telegram HR Assistant Bot

A sophisticated HR assistant Telegram bot that integrates with Ollama for AI-powered resume analysis and interview conversations.

## Features

- **Resume Analysis**: Analyze job descriptions and resumes to identify matches, gaps, and generate interview questions
- **Interactive Interviews**: Conduct AI-powered interview conversations with candidates
- **Conversation History**: Maintain context across chat sessions
- **Typing Indicators**: Realistic chat experience with typing indicators
- **Structured Responses**: JSON-based AI responses for consistent formatting

## Prerequisites

- Node.js 18+ 
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

## Configuration

Edit the `.env` file with your configuration:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

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
├── services/
│   ├── conversation.service.ts  # Conversation management
│   └── ollama.service.ts        # Ollama API integration
└── utils/
    └── logger.ts          # Logging utility
```

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run clean` - Clean build directory
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

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
2. **Ollama connection errors**: Ensure Ollama is running on the specified URL
3. **Model not found**: Make sure the specified model is available in Ollama

### Logs

The application provides detailed logging. Check console output for:
- Startup information
- Message processing logs
- Error details
- Performance metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details