import express from 'express';
import cors from 'cors';
import { config } from './config/environment.js';
import { logger } from './utils/logger.js';
import vacancyRoutes from './routes/vacancies.js';
import candidateRoutes from './routes/candidates.js';
import evaluationRoutes from './routes/evaluations.js';
import dashboardRoutes from './routes/dashboard.js';

class ApiServer {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.app.port;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // CORS configuration
    this.app.use(cors({
      origin: config.app.nodeEnv === 'production'
        ? config.cors.originProd
        : config.cors.originDev,
      credentials: true,
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.method !== 'GET' ? req.body : undefined,
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
      });
    });

    // API routes
    this.app.use('/api/vacancies', vacancyRoutes);
    this.app.use('/api/candidates', candidateRoutes);
    this.app.use('/api/evaluations', evaluationRoutes);
    this.app.use('/api/dashboard', dashboardRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route ${req.method} ${req.originalUrl} not found`,
        },
      });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled API error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      logger.info(`API Server started on port ${this.port}`, {
        port: this.port,
        environment: config.app.nodeEnv,
        nodeVersion: process.version,
      });
      console.log(`API Server is running on http://localhost:${this.port}`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default ApiServer;

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ApiServer();
  server.start();
}
