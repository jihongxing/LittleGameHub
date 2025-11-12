# Quick Start Guide: Mini-Game Aggregation Platform

**Date**: 2025-11-12  
**Feature**: Mini-Game Aggregation Platform

## Overview

This guide provides step-by-step instructions to set up and run the mini-game aggregation platform locally for development.

## Prerequisites

- Node.js 18.0+ and npm 8.0+
- PostgreSQL 8.0+
- Redis 6.0+
- Git

## Setup Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd LittleGameHub
git checkout 001-mini-game-platform
```

### 2. Backend Setup

```bash
cd backend
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration:
# - DATABASE_URL=postgresql://user:password@localhost:5432/gamehub
# - REDIS_URL=redis://localhost:6379
# - JWT_SECRET=your-secret-key
# - PAYMENT_WECHAT_APP_ID=your-wechat-app-id
# - PAYMENT_ALIPAY_APP_ID=your-alipay-app-id

# Run database migrations
npm run migrate

# Seed initial data (optional)
npm run seed

# Start development server
npm run dev
```

Backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend
npm install

# Copy environment template
cp .env.example .env

# Edit .env:
# - VITE_API_BASE_URL=http://localhost:3000/api/v1

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Mobile App Setup (Optional)

```bash
cd mobile
npm install

# Install Capacitor dependencies
npx cap sync

# For iOS
npx cap open ios

# For Android
npx cap open android
```

## Development Workflow

### Running Tests

**Backend**:
```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Frontend**:
```bash
cd frontend
npm test              # Run all tests
npm run test:ui       # UI test runner
npm run test:coverage  # Coverage report
```

### Code Quality Checks

```bash
# Backend
cd backend
npm run lint          # ESLint check
npm run lint:fix       # Auto-fix issues
npm run type-check     # TypeScript type checking

# Frontend
cd frontend
npm run lint          # ESLint check
npm run lint:fix       # Auto-fix issues
npm run type-check     # TypeScript type checking
```

### Database Management

```bash
cd backend

# Create new migration
npm run migrate:create -- --name migration-name

# Run migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Reset database (WARNING: deletes all data)
npm run migrate:reset
```

## Project Structure

```
LittleGameHub/
├── backend/              # NestJS backend
│   ├── src/
│   │   ├── modules/      # Feature modules
│   │   ├── common/        # Shared utilities
│   │   └── config/        # Configuration
│   └── tests/             # Test files
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   └── services/      # API services
│   └── tests/             # Test files
├── mobile/                # Capacitor mobile app
└── specs/                 # Feature specifications
```

## Key Features to Test

### 1. User Registration and Authentication

1. Open frontend: `http://localhost:5173`
2. Click "Register"
3. Choose authentication method (phone/email/social)
4. Complete registration
5. Verify JWT token is stored

### 2. Game Discovery and Play

1. Browse game catalog on homepage
2. Search for games
3. Click on a game card
4. View game details
5. Click "Play" to start game session
6. Verify game loads in iframe
7. Play for minimum duration
8. Exit game and verify points are awarded

### 3. Points System

1. Navigate to Points page
2. View available tasks (daily check-in, watch ad, etc.)
3. Complete a task
4. Verify points are credited
5. View transaction history
6. Navigate to redemption center
7. Select a reward
8. Redeem reward with points
9. Verify points are deducted

### 4. Membership

1. Navigate to Membership page
2. View available plans
3. Select a plan
4. Complete payment (use test payment credentials)
5. Verify membership is activated
6. Play a game and verify no ads shown
7. Verify point multiplier is applied

### 5. Invitations

1. Navigate to Profile/Invitations
2. Generate invitation link
3. Share link with test account
4. Register new account via invitation link
5. Verify inviter receives reward
6. Complete milestones as invitee
7. Verify inviter receives additional rewards

## API Testing

### Using cURL

```bash
# Register user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "auth_method": "email",
    "identifier": "test@example.com",
    "password": "password123",
    "nickname": "Test User"
  }'

# Get games
curl -X GET http://localhost:3000/api/v1/games \
  -H "Authorization: Bearer YOUR_TOKEN"

# Start game session
curl -X POST http://localhost:3000/api/v1/games/GAME_ID/sessions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman

1. Import API collection from `specs/001-mini-game-platform/contracts/api-contracts.md`
2. Set base URL: `http://localhost:3000/api/v1`
3. Set environment variables:
   - `base_url`: `http://localhost:3000/api/v1`
   - `token`: (set after login)

## Common Issues and Solutions

### Database Connection Error

**Issue**: Cannot connect to PostgreSQL

**Solution**:
- Verify PostgreSQL is running: `pg_isready`
- Check connection string in `.env`
- Verify database exists: `psql -l`
- Create database if needed: `createdb gamehub`

### Redis Connection Error

**Issue**: Cannot connect to Redis

**Solution**:
- Verify Redis is running: `redis-cli ping`
- Check Redis URL in `.env`
- Start Redis: `redis-server`

### Port Already in Use

**Issue**: Port 3000 or 5173 already in use

**Solution**:
- Find process: `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)
- Kill process or change port in configuration

### TypeScript Errors

**Issue**: Type errors in code

**Solution**:
- Run `npm run type-check` to see all errors
- Fix type issues or add proper type definitions
- Ensure all dependencies are installed

## Next Steps

1. **Read Documentation**:
   - [Data Model](./data-model.md) - Database schema and entities
   - [API Contracts](./contracts/api-contracts.md) - API endpoint specifications
   - [Research](./research.md) - Technology decisions and rationale

2. **Explore Codebase**:
   - Start with authentication module
   - Review game catalog implementation
   - Study points system logic

3. **Run Tests**:
   - Execute test suite to verify setup
   - Review test coverage reports
   - Add tests for new features

4. **Development**:
   - Follow Git workflow (feature branches)
   - Write tests before implementation (TDD)
   - Ensure code passes linting and type checking
   - Update documentation as needed

## Environment Variables Reference

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gamehub

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=3600

# Payment
PAYMENT_WECHAT_APP_ID=your-app-id
PAYMENT_WECHAT_SECRET=your-secret
PAYMENT_ALIPAY_APP_ID=your-app-id
PAYMENT_ALIPAY_SECRET=your-secret
APPLE_IAP_SHARED_SECRET=your-secret

# SMS (for phone auth)
SMS_PROVIDER=aliyun
SMS_ACCESS_KEY=your-key
SMS_ACCESS_SECRET=your-secret

# Object Storage
OSS_PROVIDER=aliyun
OSS_ACCESS_KEY=your-key
OSS_ACCESS_SECRET=your-secret
OSS_BUCKET=gamehub-assets
OSS_REGION=cn-hangzhou

# CDN
CDN_BASE_URL=https://cdn.gamehub.com
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_ENABLE_DEV_TOOLS=true
```

## Support

For issues or questions:
1. Check existing documentation
2. Review error logs
3. Search issue tracker
4. Contact development team

