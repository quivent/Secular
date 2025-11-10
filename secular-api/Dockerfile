FROM node:20-alpine

# Install required dependencies for Radicle
RUN apk add --no-cache \
    git \
    openssh \
    ca-certificates

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src

# Create non-root user
RUN addgroup -g 1001 secular && \
    adduser -D -u 1001 -G secular secular && \
    chown -R secular:secular /app

USER secular

# Expose port
EXPOSE 5288

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5288/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });"

CMD ["node", "src/server.js"]
