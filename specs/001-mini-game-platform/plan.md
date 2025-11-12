# Implementation Plan: Mini-Game Aggregation Platform

**Branch**: `001-mini-game-platform` | **Date**: 2025-11-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mini-game-platform/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This plan implements a mini-game aggregation platform that enables users to discover, play, and manage multiple mini-games through a unified interface. The platform includes points incentives, membership privileges, viral sharing, personalized recommendations, social features, and offline game management. The implementation follows a phased approach from MVP (Web + Capacitor App) to long-term scalable architecture with AI recommendations and analytics.

**Primary Requirement**: Create a platform supporting mini-game aggregation, points incentives, membership privileges, and viral sharing for sustainable operation.

**Technical Approach**: 
- **MVP Phase**: React + Vite frontend, NestJS backend, PostgreSQL + Redis, Capacitor for mobile apps
- **Long-term**: Microservices architecture, AI recommendation engine, real-time analytics, offline game support

## Technical Context

**Language/Version**: 
- Frontend: TypeScript 5.0+, React 18+
- Backend: Node.js 18+, TypeScript 5.0+, NestJS (recommended)

**Primary Dependencies**: 
- Frontend: React, React Router, Ant Design, Tailwind CSS, Vite, Capacitor
- Backend: NestJS, Express/Koa, TypeORM/Prisma, PostgreSQL, Redis
- Mobile: Capacitor (Android/iOS)
- AI/ML: TensorFlow.js / Python TensorFlow (long-term)
- Analytics: Apache Spark, Elasticsearch, Kibana (long-term)

**Storage**: 
- Primary: PostgreSQL 8.0+ (core data, game metadata with JSONB)
- Cache: Redis 6.0+ (caching, leaderboards, rate limiting)
- Object Storage: Tencent COS / Alibaba OSS / AWS S3 (game static resources)
- CDN: CloudFlare / Alibaba CDN (content delivery)

**Testing**: 
- Frontend: Vitest, React Testing Library, Playwright (E2E)
- Backend: Jest, Supertest (integration tests)
- Coverage: ≥80% for business logic

**Target Platform**: 
- Web: Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile: iOS 15+, Android 8.0+ (via Capacitor)
- Progressive Web App (PWA) support

**Project Type**: Web application (frontend + backend)

**Performance Goals**: 
- API: P95 < 200ms, P99 < 500ms
- Frontend: FCP < 1.8s, LCP < 2.5s, FID < 100ms, CLS < 0.1
- Concurrent Users: 10,000+ without degradation
- Game Launch: < 3 seconds from click to playable

**Constraints**: 
- Must support iframe sandbox for game loading
- Must comply with payment platform rules (Apple IAP, WeChat Pay, Alipay)
- Must meet WCAG 2.1 AA accessibility standards
- Must support offline game downloads (1GB free, 5GB member, 20GB offline member)
- Minimal rate limiting to maintain user experience

**Scale/Scope**: 
- Initial: 50 games, 10,000 concurrent users
- Growth: 500+ games, 100,000+ users, microservices architecture
- Data: User profiles, game sessions, points transactions, social relationships

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Code Quality Requirements
- [x] All code MUST pass ESLint and TypeScript type checking (zero errors, zero warnings)
- [x] All functions/classes/modules MUST include clear JSDoc comments
- [x] Code complexity (cyclomatic complexity) MUST NOT exceed 10
- [x] All public APIs MUST provide TypeScript type definitions
- [x] `any` type usage MUST be avoided (with justification if needed)

### Testing Standards
- [x] Business logic MUST achieve ≥80% test coverage
- [x] All API endpoints MUST include integration tests
- [x] All utility functions MUST include unit tests
- [x] All frontend components MUST include component tests
- [x] Critical user flows MUST include E2E tests
- [x] Tests MUST be independent and not rely on external services

### UX Consistency Requirements
- [x] UI MUST follow unified design system (Ant Design)
- [x] All interactions MUST provide visual feedback within 100ms
- [x] All error states MUST provide clear error messages and recovery suggestions
- [x] All loading states MUST display loading indicators
- [x] All forms MUST include real-time validation and error hints
- [x] All pages MUST support responsive design (mobile + desktop)
- [x] Accessibility MUST meet WCAG 2.1 AA level standards

### Performance Requirements
- [x] FCP (First Contentful Paint) MUST be < 1.8s
- [x] LCP (Largest Contentful Paint) MUST be < 2.5s
- [x] FID (First Input Delay) MUST be < 100ms
- [x] CLS (Cumulative Layout Shift) MUST be < 0.1
- [x] API response time P95 MUST be < 200ms, P99 < 500ms
- [x] Database queries MUST use indexes (no slow queries >100ms)
- [x] Frontend resources MUST be compressed (Gzip/Brotli) and CDN-accelerated
- [x] Images MUST use WebP format with fallback
- [x] Code splitting and lazy loading MUST be implemented

**Status**: All constitution requirements are planned and will be enforced during implementation.

## Project Structure

### Documentation (this feature)

```text
specs/001-mini-game-platform/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── modules/
│   │   ├── auth/           # Authentication (phone/SMS, social login, email/password)
│   │   ├── users/          # User management
│   │   ├── games/          # Game management and catalog
│   │   ├── points/         # Points system (earn, spend, transactions)
│   │   ├── membership/     # Membership subscriptions and privileges
│   │   ├── invitations/    # Viral sharing and invitation system
│   │   ├── recommendations/ # Personalized game recommendations
│   │   ├── social/         # Friends, leaderboards, challenges
│   │   ├── collections/    # Game collections and favorites
│   │   ├── offline/        # Offline game downloads and management
│   │   ├── achievements/   # Achievement system
│   │   ├── rewards/        # Reward redemption center
│   │   ├── task-wall/      # Advertising task wall
│   │   └── notifications/  # Real-time notifications
│   ├── common/
│   │   ├── guards/         # Auth guards, rate limiting
│   │   ├── interceptors/   # Logging, error handling
│   │   ├── decorators/     # Custom decorators
│   │   └── pipes/          # Validation pipes
│   ├── config/             # Configuration (database, redis, etc.)
│   ├── database/
│   │   ├── migrations/     # Database migrations
│   │   └── seeds/          # Seed data
│   └── main.ts             # Application entry point
├── tests/
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── package.json
└── tsconfig.json

frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── common/         # Basic components (Button, Input, etc.)
│   │   ├── business/       # Business components (GameCard, PointDisplay, etc.)
│   │   └── layout/         # Layout components (Header, Footer, Navigation)
│   ├── pages/              # Page components
│   │   ├── Home/           # Game list and discovery
│   │   ├── Game/           # Game detail and play
│   │   ├── Points/         # Points page (tasks and redemption)
│   │   ├── Membership/     # Membership page
│   │   ├── Profile/        # User profile and settings
│   │   ├── Social/         # Social features (friends, leaderboards)
│   │   ├── Collections/    # Game collections
│   │   └── Offline/        # Offline games management
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── store/              # State management (Zustand/Redux)
│   ├── utils/              # Utility functions
│   ├── constants/          # Constants and configuration
│   ├── styles/             # Global styles
│   └── assets/             # Static assets
├── public/                 # Public assets
├── tests/
│   ├── unit/               # Unit tests
│   ├── component/          # Component tests
│   └── e2e/                # E2E tests (Playwright)
├── package.json
├── vite.config.ts
└── tsconfig.json

mobile/                     # Capacitor mobile app
├── android/
├── ios/
└── capacitor.config.json
```

**Structure Decision**: Web application structure with separate frontend and backend. Frontend uses React + Vite, backend uses NestJS. Mobile apps are built using Capacitor to wrap the web app. This structure supports MVP rapid development while allowing future microservices migration.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations identified. All complexity is justified by feature requirements and scalability needs.

---

## Phase 0: Research & Outline ✅

**Status**: Complete

**Output**: `research.md`

**Key Decisions**:
- Frontend: React 18+ with Vite
- Backend: NestJS with TypeScript
- Database: PostgreSQL + Redis
- Mobile: Capacitor
- Game Loading: iframe sandbox + postMessage
- Payment: WeChat Pay, Alipay, Apple IAP
- Advertising: 穿山甲 / AdMob
- Real-time: WebSocket + Socket.io
- Recommendations: Hybrid (collaborative filtering + content-based)
- Offline: Service Worker + IndexedDB

All technology choices documented with rationale and alternatives considered.

---

## Phase 1: Design & Contracts ✅

**Status**: Complete

**Outputs**:
- `data-model.md` - Complete database schema with 19 entities
- `contracts/api-contracts.md` - RESTful API specifications
- `quickstart.md` - Development setup guide

**Key Artifacts**:

### Data Model
- 19 core entities defined with attributes, relationships, and validation rules
- State transitions documented
- Indexing strategy defined
- Data retention policy implemented

### API Contracts
- 30+ REST endpoints defined
- Authentication and authorization flows
- WebSocket events for real-time features
- Error handling and rate limiting specified

### Quick Start
- Complete setup instructions
- Development workflow documented
- Testing procedures outlined
- Common issues and solutions

**Agent Context**: Updated Cursor IDE context file with project technology stack.

---

## Next Steps

1. **Phase 2**: Generate task breakdown using `/speckit.tasks` command
2. **Implementation**: Begin MVP development following task list
3. **Testing**: Set up CI/CD pipeline with automated tests
4. **Deployment**: Prepare staging and production environments

---

## Implementation Roadmap

### MVP Phase (0-6 weeks)
- Core features: Games, Points, Membership, Invitations
- Basic recommendation (rule-based)
- Web + Capacitor mobile apps
- 50 games initial catalog

### Phase 2 (3-6 months)
- Social features (friends, leaderboards)
- Enhanced recommendations
- Advertising task wall
- iOS IAP integration

### Phase 3 (6-12 months)
- Offline game downloads
- Game collections
- Achievement system
- Analytics dashboard

### Phase 4 (12-18 months)
- AI recommendation engine
- Developer platform
- Advanced analytics
- Microservices migration
