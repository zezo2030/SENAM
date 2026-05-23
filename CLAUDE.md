# SENAM Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-05-20

## Active Technologies

- TypeScript 5.4+ on Node.js 20 LTS + NestJS 10 (`@nestjs/swagger`, `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/throttler`, `@nestjs/schedule`, `@nestjs/websockets` + `@nestjs/platform-socket.io`, `@nestjs/bull`), TypeORM 0.3 (chosen over Prisma for first-class transaction + `QueryRunner` control around the slot-decrement race), `pg` driver, `class-validator` + `class-transformer`, `bcrypt` (OTP hash), `ioredis`, BullMQ (job queue on Redis). (001-senam-backend-api)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.4+ on Node.js 20 LTS: Follow standard conventions

## Recent Changes

- 001-senam-backend-api: Added TypeScript 5.4+ on Node.js 20 LTS + NestJS 10 (`@nestjs/swagger`, `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/throttler`, `@nestjs/schedule`, `@nestjs/websockets` + `@nestjs/platform-socket.io`, `@nestjs/bull`), TypeORM 0.3 (chosen over Prisma for first-class transaction + `QueryRunner` control around the slot-decrement race), `pg` driver, `class-validator` + `class-transformer`, `bcrypt` (OTP hash), `ioredis`, BullMQ (job queue on Redis).

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
