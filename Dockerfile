# Multi-stage Dockerfile for CardSight AI Discord Bot

# ========================================
# Stage 1: Build Stage
# ========================================
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build the TypeScript code
RUN npm run build

# ========================================
# Stage 2: Production Stage
# ========================================
FROM node:24-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache --update dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy necessary files
COPY .env.example ./

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check (optional - checks if the process is running)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the bot
CMD ["node", "dist/index.js"]

# Labels for metadata
LABEL org.opencontainers.image.title="CardSight AI Discord Bot" \
      org.opencontainers.image.description="Discord bot demonstrating CardSight AI's card identification capabilities" \
      org.opencontainers.image.vendor="CardSight AI" \
      org.opencontainers.image.source="https://github.com/CardSightAI/cardsightai-demo-discord" \
      org.opencontainers.image.licenses="MIT"