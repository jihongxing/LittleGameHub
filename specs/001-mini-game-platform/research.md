# Research: Mini-Game Aggregation Platform

**Date**: 2025-11-12  
**Feature**: Mini-Game Aggregation Platform  
**Phase**: 0 - Outline & Research

## Technology Decisions

### 1. Frontend Framework: React + Vite

**Decision**: Use React 18+ with Vite as build tool

**Rationale**:
- React provides mature ecosystem and component-based architecture
- Vite offers fast HMR and build times, critical for development velocity
- Large community and extensive library support (Ant Design, React Router)
- TypeScript support is excellent
- Compatible with Capacitor for mobile app packaging

**Alternatives Considered**:
- Vue 3: Similar capabilities but smaller ecosystem in China market
- Next.js: Overkill for MVP, adds complexity for SPA requirements
- Angular: Too heavy for this use case

**Implementation Notes**:
- Use React Hooks for state management
- Implement code splitting with React.lazy()
- Use Vite's PWA plugin for offline support

---

### 2. Backend Framework: NestJS

**Decision**: Use NestJS with TypeScript

**Rationale**:
- Built-in TypeScript support and decorator-based architecture
- Modular structure aligns with future microservices migration
- Excellent dependency injection and testing support
- Built-in support for WebSockets, GraphQL, microservices
- Strong ecosystem for authentication, validation, database ORM

**Alternatives Considered**:
- Express.js: More lightweight but requires more boilerplate
- Fastify: Faster but smaller ecosystem
- Koa.js: Similar to Express, less opinionated structure

**Implementation Notes**:
- Use NestJS modules for feature organization
- Implement guards for authentication and authorization
- Use interceptors for logging and error handling

---

### 3. Database: PostgreSQL + Redis

**Decision**: PostgreSQL for primary storage, Redis for caching and real-time data

**Rationale**:
- PostgreSQL JSONB provides flexibility for game metadata while maintaining ACID guarantees
- Single database simplifies operations and reduces complexity
- Redis provides fast caching for game catalog, leaderboards, and session data
- Both are mature, well-documented, and production-proven
- PostgreSQL supports complex queries needed for recommendations and analytics

**Alternatives Considered**:
- MongoDB: Less structured, harder to maintain data integrity
- MySQL: Less flexible JSON support compared to PostgreSQL
- DynamoDB: Vendor lock-in, higher cost

**Implementation Notes**:
- Use JSONB columns for game metadata (tags, point rules, etc.)
- Implement Redis caching for frequently accessed data (game catalog, user points)
- Use Redis Streams for message queue in MVP phase
- Plan migration to RabbitMQ/Kafka for long-term scalability

---

### 4. Mobile App: Capacitor

**Decision**: Use Capacitor to wrap web app for iOS and Android

**Rationale**:
- Single codebase for web and mobile reduces development and maintenance cost
- Native plugin support for device features (camera, storage, push notifications)
- Can use native SDKs (advertising, payment) through plugins
- Faster development cycle compared to native apps
- Supports PWA features for offline functionality

**Alternatives Considered**:
- React Native: Requires separate codebase, more complex
- Flutter: Different language (Dart), steeper learning curve
- Native iOS/Android: Much higher development cost and time

**Implementation Notes**:
- Use Capacitor plugins for native advertising SDKs (穿山甲, AdMob)
- Implement native payment plugins for Apple IAP and WeChat/Alipay
- Use Capacitor Storage API for offline game data

---

### 5. Game Loading: iframe Sandbox + postMessage

**Decision**: Load games in sandboxed iframes with postMessage for communication

**Rationale**:
- Sandbox provides security isolation between platform and games
- postMessage enables safe cross-origin communication
- Standard web technology, no special requirements
- Allows games to be hosted on different domains/CDNs
- CSP headers can further restrict game capabilities

**Alternatives Considered**:
- Web Components: Less browser support, more complex
- Direct embedding: Security risk, no isolation
- WebView (mobile): Platform-specific, harder to maintain

**Implementation Notes**:
- Implement strict CSP headers
- Use iframe sandbox attributes to restrict capabilities
- Define clear postMessage API contract between platform and games
- Implement game heartbeat mechanism to detect crashes

---

### 6. Payment Integration

**Decision**: Support WeChat Pay, Alipay (Web), and Apple IAP with backend receipt validation

**Rationale**:
- WeChat Pay and Alipay are dominant in China market
- Apple IAP required for iOS App Store compliance
- Backend validation prevents fraud and ensures payment security
- Standard payment gateways provide reliable infrastructure

**Alternatives Considered**:
- Stripe: Not available in China
- PayPal: Low adoption in target market
- Direct payment processing: Too complex, compliance risk

**Implementation Notes**:
- Implement payment webhooks for status updates
- Store payment receipts in database for audit
- Implement automatic retry for failed payments (3 attempts)
- Handle refunds according to platform rules (Apple 7-day, WeChat/Alipay per agreement)

---

### 7. Advertising SDK: 穿山甲 / AdMob

**Decision**: Use 穿山甲 (China) and AdMob (international) with Capacitor plugins

**Rationale**:
- 穿山甲 is leading ad network in China with high eCPM
- AdMob provides international coverage
- Native SDKs offer better performance and fill rates
- Capacitor plugins bridge native SDKs to web app

**Alternatives Considered**:
- Web-only ad networks: Lower fill rates and eCPM
- Self-hosted ads: Requires ad sales team, not viable for MVP

**Implementation Notes**:
- Implement ad mediation for optimal eCPM
- Use event callbacks to trigger point rewards
- Implement ad frequency capping to balance user experience
- Plan for server-side mediation in long-term

---

### 8. Real-time Features: WebSocket + Socket.io

**Decision**: Use WebSocket with Socket.io for real-time features

**Rationale**:
- Socket.io provides fallback mechanisms and room management
- Well-integrated with NestJS
- Supports both WebSocket and HTTP long-polling fallback
- Good performance for leaderboards and notifications

**Alternatives Considered**:
- Server-Sent Events (SSE): One-way only, insufficient for bidirectional communication
- HTTP polling: Higher latency and server load
- Native WebSocket: Less features, more manual implementation

**Implementation Notes**:
- Use Socket.io rooms for game-specific leaderboards
- Implement connection management and reconnection logic
- Use Redis adapter for multi-server scaling

---

### 9. Recommendation System: Collaborative Filtering + Content-Based

**Decision**: Implement hybrid recommendation using collaborative filtering and content-based algorithms

**Rationale**:
- Collaborative filtering works well with user behavior data
- Content-based filtering handles cold start (new users/games)
- Hybrid approach balances accuracy and coverage
- Can start simple and evolve to deep learning models

**Alternatives Considered**:
- Deep learning only: Requires large dataset, complex infrastructure
- Content-based only: Less personalized, lower accuracy
- Rule-based: Too rigid, doesn't adapt to user preferences

**Implementation Notes**:
- MVP: Use simple collaborative filtering (user-item matrix)
- Long-term: Integrate TensorFlow/PyTorch for deep learning models
- Implement A/B testing framework for algorithm evaluation
- Cache recommendations in Redis for performance

---

### 10. Offline Game Support: Service Worker + IndexedDB

**Decision**: Use Service Worker for caching and IndexedDB for game data storage

**Rationale**:
- Service Worker enables offline functionality and background sync
- IndexedDB provides large storage capacity (quota-based)
- Standard web APIs, no special plugins needed
- Works across web and mobile (via Capacitor)

**Alternatives Considered**:
- LocalStorage: Too small (5-10MB limit)
- File System API: Limited browser support
- Native storage: Platform-specific, harder to maintain

**Implementation Notes**:
- Implement cache-first strategy for offline games
- Use IndexedDB for game state and progress
- Implement storage quota management (1GB free, 5GB member, 20GB offline member)
- Plan for incremental updates to minimize download size

---

### 11. Authentication: Multiple Methods

**Decision**: Support phone/SMS, WeChat/QQ social login, and email/username + password

**Rationale**:
- Phone/SMS is primary method in China market
- Social login reduces friction and improves conversion
- Email/password provides fallback for users without phone/social accounts
- Multiple methods linked to one account improves user experience

**Alternatives Considered**:
- Phone only: Excludes users without phone numbers
- Social only: Dependency on third-party services
- Email only: Low adoption in target market

**Implementation Notes**:
- Use JWT for session management
- Implement OAuth 2.0 for social login
- Store multiple auth methods linked to user account
- Implement SMS verification service integration

---

### 12. Data Retention and Privacy

**Decision**: Implement tiered data retention (active retained, inactive 3 years, deletion 30 days)

**Rationale**:
- Balances business needs (analytics, user support) with privacy compliance
- Meets GDPR and China data protection requirements
- Allows data export before deletion
- Retains anonymized statistics for business analysis

**Alternatives Considered**:
- Permanent retention: Privacy compliance risk
- Immediate deletion: Loses valuable business data
- Fixed retention period: Doesn't account for user activity

**Implementation Notes**:
- Implement automated data retention job
- Provide data export API (JSON format)
- Anonymize data before deletion (hash user IDs, remove PII)
- Log all data deletion events for audit

---

## Architecture Patterns

### MVP Phase (0-6 weeks)
- Monolithic backend (NestJS modules)
- Single PostgreSQL database
- Redis for caching
- React SPA frontend
- Capacitor mobile apps
- Basic recommendation (rule-based)

### Long-term Phase (12+ months)
- Microservices architecture (Docker + Kubernetes)
- Service mesh for inter-service communication
- Separate databases per service (bounded contexts)
- Message queue (RabbitMQ/Kafka) for async processing
- AI recommendation service (TensorFlow/PyTorch)
- Real-time analytics (Apache Spark + Elasticsearch)
- CDN for global content delivery

---

## Security Considerations

1. **Game Isolation**: iframe sandbox with strict CSP
2. **Authentication**: JWT with refresh tokens, rate limiting
3. **Payment Security**: Backend receipt validation, no client-side payment processing
4. **Data Protection**: Encryption at rest and in transit (HTTPS/TLS)
5. **Rate Limiting**: Basic frequency checks for points and invitations
6. **Input Validation**: Server-side validation for all user inputs
7. **SQL Injection Prevention**: Use ORM with parameterized queries

---

## Performance Optimization

1. **Frontend**:
   - Code splitting and lazy loading
   - Image optimization (WebP with fallback)
   - CDN for static assets
   - Service Worker caching

2. **Backend**:
   - Database indexing (all foreign keys, frequently queried fields)
   - Redis caching (game catalog, user points, leaderboards)
   - Connection pooling
   - Query optimization

3. **Database**:
   - Partition large tables (game sessions, point transactions)
   - Read replicas for analytics queries
   - JSONB indexes for game metadata queries

---

## Deployment Strategy

### MVP
- Single server deployment (backend + database)
- Static frontend on CDN
- Mobile apps via App Store / Google Play

### Long-term
- Containerized services (Docker)
- Orchestration (Kubernetes)
- Auto-scaling based on load
- Multi-region deployment
- Blue-green deployments for zero downtime

---

## Monitoring and Observability

1. **Application Monitoring**: Sentry for error tracking
2. **Performance Monitoring**: Prometheus + Grafana
3. **Logging**: Structured logging (Winston), centralized log aggregation
4. **Analytics**: ClickHouse or BigQuery for user behavior analysis
5. **Alerting**: Critical error alerts, performance degradation alerts

---

## Next Steps

1. Set up development environment (Node.js, PostgreSQL, Redis)
2. Initialize NestJS project structure
3. Initialize React + Vite frontend project
4. Set up Capacitor mobile projects
5. Configure CI/CD pipeline
6. Implement MVP features (games, points, membership, invitations)
7. Integrate payment and advertising SDKs
8. Deploy to staging environment
9. Performance testing and optimization
10. Production deployment

