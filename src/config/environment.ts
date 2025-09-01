import dotenv from 'dotenv';

dotenv.config();

export const config = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'gemma3n:latest',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'hr_bot',
    user: process.env.DB_USER || 'hr_user',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10),
  },
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
  },
};

// Validate required environment variables
if (!config.telegram.token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

if (!config.database.password && config.app.nodeEnv === 'production') {
  throw new Error('DB_PASSWORD is required in production');
}