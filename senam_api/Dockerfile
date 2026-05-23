# ─── Stage 1: builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies (for native modules like bcrypt, pg)
RUN apk add --no-cache python3 make g++

# Copy package manifests first (layer cache)
COPY package.json package-lock.json ./

# Install ALL dependencies (dev + prod) for the build
RUN npm ci --include=dev

# Copy source
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ ./src/

# Compile TypeScript
RUN npm run build

# ─── Stage 2: production image ────────────────────────────────────────────────
FROM node:20-alpine AS production

# Create a non-root user
RUN addgroup -S senam && adduser -S senam -G senam

WORKDIR /app

# Install production-only native module dependencies
RUN apk add --no-cache python3 make g++

# Copy package manifests
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Remove build tools after npm install
RUN apk del python3 make g++

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy migrations (needed at runtime for npm run migration:run)
COPY migrations/ ./migrations/

# Drop privileges
USER senam

# Expose the API port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/healthz || exit 1

# Run the compiled entry point
CMD ["node", "dist/main"]
