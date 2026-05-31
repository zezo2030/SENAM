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
COPY tsconfig.json tsconfig.build.json tsconfig.migrations.json nest-cli.json ./
COPY src/ ./src/
# tsconfig.migrations.json compiles these into dist/migrations.
COPY migrations/ ./migrations/

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

# ─── Stage 3: development (hot reload, used by docker-compose.dev.yml) ─────────
FROM node:20-alpine AS development

WORKDIR /app

# Native module build deps (bcrypt, pg) — kept in dev image
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./

# Full install incl. devDependencies (nest CLI, ts-node, typeorm, tsc)
RUN npm ci --include=dev

# Source is bind-mounted by docker-compose.dev.yml; copy as a fallback so the
# image is runnable on its own.
COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
