# NestJS Migration Guide

## Current Status

The backend currently uses Express.js. This document outlines the migration plan to NestJS as specified in the tasks.

## Migration Steps

### 1. Install NestJS Dependencies

```bash
npm install @nestjs/core @nestjs/common @nestjs/platform-express @nestjs/config
npm install reflect-metadata rxjs
npm install -D @nestjs/cli @nestjs/testing
```

### 2. Update package.json Scripts

Add NestJS-specific scripts:

```json
{
  "scripts": {
    "start:nestjs": "nest start",
    "start:dev:nestjs": "nest start --watch",
    "start:prod:nestjs": "node dist/main.nestjs.js",
    "build:nestjs": "nest build"
  }
}
```

### 3. Create NestJS Application Structure

- `src/app.module.ts` - Root module (already created)
- `src/app.controller.ts` - Root controller (already created)
- `src/app.service.ts` - Root service (already created)
- `src/main.nestjs.ts` - NestJS entry point (already created)

### 4. Migrate Modules

Create NestJS modules for each feature:

- `src/modules/auth/auth.module.ts` - Authentication module
- `src/modules/users/users.module.ts` - User management module
- `src/modules/games/games.module.ts` - Game management module
- `src/modules/downloads/downloads.module.ts` - Download management module
- `src/modules/favorites/favorites.module.ts` - Favorites module

### 5. Migrate Controllers

Convert Express controllers to NestJS controllers:

- Express: `src/controllers/authController.ts`
- NestJS: `src/modules/auth/auth.controller.ts`

### 6. Migrate Services

Extract business logic into NestJS services:

- `src/modules/auth/auth.service.ts`
- `src/modules/users/users.service.ts`
- etc.

### 7. Migrate Middleware

Convert Express middleware to NestJS guards/interceptors:

- `src/middleware/auth.ts` → `src/common/guards/jwt-auth.guard.ts`
- `src/middleware/errorHandler.ts` → `src/common/interceptors/error-handler.interceptor.ts`
- `src/middleware/requestLogger.ts` → `src/common/interceptors/logging.interceptor.ts`

### 8. Database Integration

- Use `@nestjs/typeorm` or `@nestjs/sequelize` for database integration
- Migrate models to entities
- Set up database module

### 9. Testing

- Update tests to use NestJS testing utilities
- Use `@nestjs/testing` for module testing

## Current Express Code

The existing Express code is located in:
- `src/app.ts` - Express application setup
- `src/index.ts` - Express entry point
- `src/controllers/` - Express controllers
- `src/routes/` - Express routes
- `src/middleware/` - Express middleware

This code will remain functional until the migration is complete.

## Migration Priority

1. **Phase 1**: Set up NestJS structure (current)
2. **Phase 2**: Migrate authentication module
3. **Phase 3**: Migrate user management module
4. **Phase 4**: Migrate game management module
5. **Phase 5**: Migrate remaining modules
6. **Phase 6**: Remove Express code

## Notes

- Both Express and NestJS can coexist during migration
- Use feature flags to switch between Express and NestJS
- Keep Express code until all features are migrated
- Update API documentation after migration

