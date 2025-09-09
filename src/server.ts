import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config/environment.js';
import { logger } from './utils/logger.js';
import vacancyRoutes from './routes/vacancies.js';
import candidateRoutes from './routes/candidates.js';
import evaluationRoutes from './routes/evaluations.js';
import dashboardRoutes from './routes/dashboard.js';
import promptSettingsRoutes from './routes/prompt-settings.js';
import settingsRoutes from './routes/settings.js';
import interviewResultsRoutes from './routes/interview-results.js';

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
    const corsOptions = {
      origin: config.cors.allowExternalApi 
        ? true // Allow all origins for external API calls
        : (config.app.nodeEnv === 'production'
          ? config.cors.originProd
          : config.cors.originDev),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    };
    
    this.app.use(cors(corsOptions));

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
    this.app.use('/api/prompt-settings', promptSettingsRoutes);
    this.app.use('/api/settings', settingsRoutes);
    this.app.use('/api/interview-results', interviewResultsRoutes);

    // File serving endpoint for CV files
    this.app.get('/api/files/cv/:candidateId/:filename', (req, res) => {
      try {
        const { candidateId, filename } = req.params;
        // Decode the URL-encoded filename to handle Cyrillic and special characters
        const decodedFilename = decodeURIComponent(filename);
        const filePath = path.join(process.cwd(), 'uploads', decodedFilename);
        
        // Security check: ensure the filename contains the candidate ID
        if (!decodedFilename.startsWith(`${candidateId}_`)) {
          res.status(403).json({
            success: false,
            error: {
              code: 'ACCESS_DENIED',
              message: 'Access denied to this file',
            },
          });
          return;
        }

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          res.status(404).json({
            success: false,
            error: {
              code: 'FILE_NOT_FOUND',
              message: 'File not found',
            },
          });
          return;
        }

        // Set appropriate headers for PDF files
        const fileExtension = path.extname(decodedFilename).toLowerCase();
        if (fileExtension === '.pdf') {
          res.setHeader('Content-Type', 'application/pdf');
          // Use RFC 5987 encoding for non-ASCII filenames in Content-Disposition
          res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(decodedFilename)}`);
        } else {
          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(decodedFilename)}`);
        }

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
          logger.error('Error streaming CV file', {
            error: error.message,
            candidateId,
            filename,
          });
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: {
                code: 'FILE_STREAM_ERROR',
                message: 'Error streaming file',
              },
            });
          }
        });
      } catch (error) {
        logger.error('Error in CV file endpoint', {
          error: error instanceof Error ? error.message : 'Unknown error',
          candidateId: req.params.candidateId,
          filename: req.params.filename,
        });
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
        });
      }
    });

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
