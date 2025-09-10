# Backend Dockerfile - Node.js TypeScript application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy source code
COPY src/ ./src/

# Build the TypeScript application
RUN npm run build

# Production stage
FROM node:18-alpine

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create directories for logs and uploads if needed
RUN mkdir -p /app/logs /app/uploads && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: 3000, path: '/health', timeout: 2000 }; \
    const req = http.request(options, (res) => { \
        if (res.statusCode === 200) process.exit(0); \
        else process.exit(1); \
    }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# Start the application
CMD ["node", "dist/server.js"]
