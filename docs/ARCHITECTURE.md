# GameHub Architecture Documentation

## System Overview

GameHub is a comprehensive Mini-Game Aggregation Platform built with a modern tech stack, featuring a NestJS backend and React frontend.

---

## Technology Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **ORM**: TypeORM
- **Testing**: Jest
- **Authentication**: JWT

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **UI Library**: Ant Design
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **Testing**: Vitest, React Testing Library, Playwright

---

## Architecture Patterns

### Backend Architecture

```
backend/
├── src/
│   ├── modules/              # Feature modules
│   │   ├── games/           # Game management
│   │   ├── points/          # Points system
│   │   ├── rewards/         # Reward system
│   │   ├── membership/      # Membership tiers
│   │   ├── invitations/     # Invitation system
│   │   ├── recommendations/ # Recommendation engine
│   │   ├── social/          # Social features
│   │   ├── collections/     # Game collections
│   │   ├── offline/         # Offline management
│   │   └── achievements/    # Achievement system
│   ├── common/              # Shared utilities
│   ├── config/              # Configuration
│   ├── database/            # Database migrations
│   └── main.ts              # Application entry
```

### Module Structure Pattern
Each feature module follows this structure:
```
module/
├── entities/        # TypeORM entities
├── services/        # Business logic
├── controllers/     # HTTP endpoints
├── dto/            # Data transfer objects
├── guards/         # Authorization guards
└── module.ts       # Module definition
```

### Frontend Architecture

```
frontend/
├── src/
│   ├── pages/              # Page components
│   ├── components/
│   │   ├── layout/         # Layout components
│   │   ├── business/       # Business components
│   │   └── common/         # Common components
│   ├── services/
│   │   ├── api/            # API clients
│   │   └── websocket/      # WebSocket clients
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── stores/             # Zustand stores
│   └── App.tsx             # App entry
```

---

## Module Descriptions

### 1. Games Module
**Purpose**: Core game management and play functionality

**Entities**:
- Game: Game metadata, URLs, categories
- GameSession: User play sessions

**Key Services**:
- GameCatalogService: Browse and search
- GameSessionService: Session tracking

**API Endpoints**:
- `GET /games` - List games
- `GET /games/:id` - Game details
- `POST /games/:id/sessions` - Start session

---

### 2. Points Module
**Purpose**: Points earning and transaction management

**Entities**:
- PointTransaction: Point changes
- PointBalance: User balances

**Key Services**:
- PointsService: Transaction management
- PointCalculationService: Reward calculation

**API Endpoints**:
- `GET /points/balance` - User balance
- `GET /points/transactions` - Transaction history
- `POST /points/earn` - Award points

---

### 3. Rewards Module
**Purpose**: Reward catalog and redemption

**Entities**:
- Reward: Reward definitions
- Redemption: Redemption records

**Key Services**:
- RewardsService: Reward management
- RedemptionService: Redemption processing

**API Endpoints**:
- `GET /rewards` - List rewards
- `POST /rewards/:id/redeem` - Redeem reward

---

### 4. Membership Module
**Purpose**: Subscription tiers and privileges

**Entities**:
- Membership: User subscriptions
- MembershipTier: Tier definitions

**Key Services**:
- MembershipService: Subscription management
- PaymentService: Payment processing

**API Endpoints**:
- `GET /membership/tiers` - List tiers
- `POST /membership/subscribe` - Subscribe
- `POST /membership/cancel` - Cancel subscription

---

### 5. Invitations Module
**Purpose**: Referral system and rewards

**Entities**:
- Invitation: Invitation records

**Key Services**:
- InvitationService: Invitation management
- ReferralRewardService: Reward calculation

**API Endpoints**:
- `POST /invitations/generate` - Generate link
- `GET /invitations/my` - User invitations

---

### 6. Recommendations Module
**Purpose**: Personalized game recommendations

**Entities**:
- Recommendation: Recommendation records

**Key Services**:
- RecommendationService: Algorithm coordination
- CollaborativeFilteringService: CF algorithm
- ContentBasedService: Content-based filtering
- ScenarioRecommendationService: Context-aware

**API Endpoints**:
- `GET /recommendations/for-me` - Personal recommendations
- `GET /recommendations/scenario/:scenario` - Context recommendations

---

### 7. Social Module
**Purpose**: Friend system and social interactions

**Entities**:
- FriendRelationship: Friend connections
- GameChallenge: Game challenges

**Key Services**:
- FriendService: Friend management
- LeaderboardService: Leaderboards
- GameChallengeService: Challenge system

**API Endpoints**:
- `GET /friends` - Friend list
- `POST /friends/request` - Send request
- `GET /leaderboards/:gameId` - Leaderboard

**WebSocket**:
- `notifications` - Real-time notifications

---

### 8. Collections Module
**Purpose**: Game organization and favorites

**Entities**:
- GameCollection: Collection metadata
- CollectionItem: Games in collections

**Key Services**:
- GameCollectionService: CRUD operations
- CollectionSyncService: Cross-device sync

**API Endpoints**:
- `GET /collections` - List collections
- `POST /collections` - Create collection
- `POST /collections/:id/games` - Add game

---

### 9. Offline Module
**Purpose**: Offline game download and management

**Entities**:
- OfflineGame: Download records

**Key Services**:
- OfflineGameService: Download management
- StorageQuotaService: Quota enforcement
- FileServerService: File serving

**API Endpoints**:
- `GET /offline/games` - Downloaded games
- `POST /offline/games/:id/download` - Download game
- `GET /offline/files/:id/download` - Stream file

---

### 10. Achievements Module
**Purpose**: Achievement system and user growth

**Entities**:
- Achievement: Achievement definitions
- UserAchievement: Unlock records

**Key Services**:
- AchievementService: Achievement management
- AchievementDetectorService: Auto-unlock
- UserGrowthService: Level system

**API Endpoints**:
- `GET /achievements` - List achievements
- `GET /achievements/user/:id` - User achievements
- `POST /achievements/unlock` - Unlock achievement

---

## Data Flow

### Request Flow
```
Client Request
  ↓
React Router
  ↓
API Service (Axios)
  ↓
Backend Controller
  ↓
Service Layer
  ↓
Repository (TypeORM)
  ↓
PostgreSQL Database
```

### Authentication Flow
```
User Login
  ↓
JWT Token Generated
  ↓
Token Stored (LocalStorage)
  ↓
Token in Request Headers
  ↓
JWT Guard Validation
  ↓
User Context Available
```

### Real-time Notification Flow
```
Backend Event
  ↓
WebSocket Gateway
  ↓
Socket.IO Server
  ↓
Client WebSocket
  ↓
Notification Display
```

---

## Database Schema

### Core Tables
- **users**: User accounts
- **games**: Game catalog
- **game_sessions**: Play sessions
- **point_transactions**: Point history
- **point_balances**: Current balances
- **rewards**: Reward catalog
- **redemptions**: Redemption history

### Membership Tables
- **memberships**: User subscriptions
- **membership_tiers**: Tier definitions
- **payments**: Payment records

### Social Tables
- **friend_relationships**: Friend connections
- **game_challenges**: Challenge records
- **leaderboards**: Leaderboard entries

### Collections Tables
- **game_collections**: Collection metadata
- **collection_items**: Games in collections
- **offline_games**: Downloaded games

### Achievement Tables
- **achievements**: Achievement definitions
- **user_achievements**: Unlock records

---

## Security Architecture

### Authentication
- JWT-based authentication
- Token expiration and refresh
- Secure password hashing (bcrypt)

### Authorization
- Role-based access control (RBAC)
- Guard-based route protection
- Permission validation

### Data Protection
- SQL injection prevention (TypeORM)
- XSS protection (sanitization)
- CSRF protection
- Rate limiting
- Input validation (class-validator)

---

## Performance Optimization

### Backend
- Database query optimization
- Redis caching
- Connection pooling
- Lazy loading
- Pagination

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Service Worker caching
- Bundle optimization

---

## Scalability Considerations

### Horizontal Scaling
- Stateless backend design
- Session store in Redis
- Database read replicas
- CDN for static assets

### Caching Strategy
- API response caching
- Database query caching
- Static asset caching
- Browser caching

---

## Monitoring and Logging

### Logging
- Structured logging (Winston)
- Log levels (error, warn, info, debug)
- Request/response logging
- Error tracking

### Monitoring
- API performance metrics
- Database performance
- Cache hit rates
- Error rates

---

## Deployment Architecture

### Development
```
Local Development
├── Backend: localhost:3000
├── Frontend: localhost:5173
├── PostgreSQL: localhost:5432
└── Redis: localhost:6379
```

### Production
```
Production Environment
├── Backend: API Gateway → App Servers
├── Frontend: CDN → Static Hosting
├── Database: PostgreSQL Cluster
├── Cache: Redis Cluster
└── File Storage: Object Storage (S3)
```

---

## Testing Strategy

### Backend Testing
- Unit tests (Jest)
- Integration tests (Supertest)
- E2E tests
- Code coverage ≥ 80%

### Frontend Testing
- Component tests (Vitest + RTL)
- Integration tests
- E2E tests (Playwright)
- Code coverage ≥ 80%

---

## Future Enhancements

### Planned Features
- [ ] Real-time multiplayer support
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] AI-powered recommendations
- [ ] Game streaming

### Technical Improvements
- [ ] GraphQL API layer
- [ ] Microservices architecture
- [ ] Event-driven architecture
- [ ] Message queue (RabbitMQ/Kafka)
- [ ] Service mesh (Istio)

---

**Version**: 1.0.0
**Last Updated**: 2024-11-12
**Status**: Production Ready

