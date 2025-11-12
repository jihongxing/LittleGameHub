# Performance Optimization Guide

## Performance Requirements (Phase 11)

### Target Metrics
- **FCP** (First Contentful Paint): < 1.8s
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **API Response Time**: P95 < 200ms, P99 < 500ms

---

## Backend Optimizations (T236, T239)

### 1. Database Query Optimization (T240)

#### Add Indexes
```sql
-- Game queries
CREATE INDEX idx_games_category ON games(category);
CREATE INDEX idx_games_availability ON games(availability_status);
CREATE INDEX idx_games_featured ON games(is_featured);

-- Point transactions
CREATE INDEX idx_point_transactions_user ON point_transactions(user_id, created_at DESC);
CREATE INDEX idx_point_transactions_type ON point_transactions(transaction_type);

-- Sessions
CREATE INDEX idx_game_sessions_user ON game_sessions(user_id, created_at DESC);
CREATE INDEX idx_game_sessions_game ON game_sessions(game_id, created_at DESC);

-- Achievements
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_achievements_category ON achievements(category);

-- Social
CREATE INDEX idx_friend_relationships_users ON friend_relationships(user_id, friend_id);
CREATE INDEX idx_friend_relationships_status ON friend_relationships(status);
```

#### Query Optimization Patterns
```typescript
// BAD: N+1 query problem
async getAllGames() {
  const games = await this.gameRepository.find();
  for (const game of games) {
    game.sessions = await this.sessionRepository.find({ gameId: game.id });
  }
  return games;
}

// GOOD: Use joins
async getAllGames() {
  return this.gameRepository.find({
    relations: ['sessions'],
    take: 20, // Pagination
  });
}

// GOOD: Use query builder for complex queries
async getPopularGames() {
  return this.gameRepository
    .createQueryBuilder('game')
    .leftJoin('game.sessions', 'session')
    .select('game.*, COUNT(session.id) as play_count')
    .groupBy('game.id')
    .orderBy('play_count', 'DESC')
    .limit(10)
    .getMany();
}
```

### 2. Caching Strategy

#### Redis Caching
```typescript
@Injectable()
export class GameCacheService {
  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  async getGame(id: number): Promise<Game | null> {
    // Try cache first
    const cached = await this.redis.get(`game:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Cache miss - fetch from DB
    const game = await this.gameRepository.findOne(id);
    if (game) {
      // Cache for 1 hour
      await this.redis.setex(`game:${id}`, 3600, JSON.stringify(game));
    }

    return game;
  }
}
```

### 3. Response Compression (T241)

Enable in `main.ts`:
```typescript
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable compression
  app.use(compression());
  
  await app.listen(3000);
}
```

### 4. Connection Pooling

Configure in `database.config.ts`:
```typescript
export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  // ... other config
  
  // Connection pool settings
  extra: {
    max: 20, // Maximum pool size
    min: 5,  // Minimum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});
```

---

## Frontend Optimizations (T237)

### 1. Code Splitting and Lazy Loading (T244)

```typescript
// App.tsx
import { lazy, Suspense } from 'react';

// Lazy load pages
const GameList = lazy(() => import('@/pages/Home/GameList'));
const GameDetail = lazy(() => import('@/pages/Game/GameDetail'));
const AchievementsPage = lazy(() => import('@/pages/Profile/AchievementsPage'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/games" element={<GameList />} />
        <Route path="/games/:id" element={<GameDetail />} />
        <Route path="/achievements" element={<AchievementsPage />} />
      </Routes>
    </Suspense>
  );
}
```

### 2. Image Optimization (T243)

#### Use WebP with Fallback
```typescript
interface OptimizedImageProps {
  src: string;
  alt: string;
  webpSrc?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({ src, alt, webpSrc }) => {
  return (
    <picture>
      {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
      <img src={src} alt={alt} loading="lazy" />
    </picture>
  );
};
```

#### Lazy Loading Images
```typescript
const GameCard = ({ game }) => {
  return (
    <Card
      cover={
        <img 
          src={game.cover_image_url} 
          alt={game.title}
          loading="lazy" // Native lazy loading
        />
      }
    />
  );
};
```

### 3. Memoization

```typescript
import { useMemo, useCallback } from 'react';

const GameList = ({ games, filters }) => {
  // Memoize expensive calculations
  const filteredGames = useMemo(() => {
    return games.filter(game => 
      game.category === filters.category &&
      game.rating >= filters.minRating
    );
  }, [games, filters]);

  // Memoize callbacks
  const handleGameClick = useCallback((gameId: number) => {
    navigate(`/games/${gameId}`);
  }, [navigate]);

  return (
    <div>
      {filteredGames.map(game => (
        <GameCard key={game.id} game={game} onClick={handleGameClick} />
      ))}
    </div>
  );
};
```

### 4. Virtual Scrolling

For large lists:
```typescript
import { FixedSizeList } from 'react-window';

const VirtualGameList = ({ games }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <GameCard game={games[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={games.length}
      itemSize={200}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

### 5. Bundle Size Optimization

```json
// package.json
{
  "scripts": {
    "analyze": "vite-bundle-visualizer"
  }
}
```

```bash
npm run analyze
```

Remove unused dependencies and optimize imports:
```typescript
// BAD: Import entire library
import * as _ from 'lodash';

// GOOD: Import only what you need
import debounce from 'lodash/debounce';
```

---

## Lighthouse CI (T245)

### Setup Lighthouse CI

1. Install:
```bash
npm install -g @lhci/cli
```

2. Configuration `.lighthouserc.js`:
```javascript
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173'],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-input-delay': ['error', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

3. Run:
```bash
# Build first
npm run build
npm run preview

# Run Lighthouse CI
lhci autorun
```

---

## CDN Configuration (T242)

### Cloudflare Setup

1. Add domain to Cloudflare
2. Configure DNS records
3. Enable caching rules:

```
Cache Rule: Cache Everything
Edge Cache TTL: 1 day
Browser Cache TTL: 4 hours
```

### Nginx CDN Headers

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header X-Content-Type-Options "nosniff";
}
```

---

## Monitoring

### Performance Monitoring Setup

```typescript
// Frontend
import { onCLS, onFID, onFCP, onLCP } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(metric),
  });
}

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onFCP(sendToAnalytics);
onLCP(sendToAnalytics);
```

### Backend Monitoring

```typescript
// Add request timing middleware
@Injectable()
export class TimingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      // Log slow requests
      if (duration > 200) {
        console.warn(`Slow request: ${req.method} ${req.url} took ${duration}ms`);
      }
    });
    
    next();
  }
}
```

---

## Performance Checklist

### Backend
- [X] Database indexes added
- [X] Query optimization implemented
- [X] Caching strategy in place
- [X] Response compression enabled
- [X] Connection pooling configured
- [ ] Slow query logging enabled
- [ ] API response time monitoring

### Frontend
- [X] Code splitting implemented
- [X] Lazy loading for routes
- [X] Image optimization
- [X] Bundle size optimized
- [ ] Service Worker caching
- [ ] CDN configured
- [ ] Lighthouse CI setup

### Monitoring
- [ ] Performance metrics tracking
- [ ] Alert thresholds set
- [ ] Dashboard configured
- [ ] Regular audits scheduled

---

## Tools

- **Backend**: clinic.js, autocannon
- **Frontend**: Lighthouse, WebPageTest, Chrome DevTools
- **Database**: pg_stat_statements, EXPLAIN ANALYZE
- **Monitoring**: New Relic, Datadog, PM2 Plus

---

**Last Updated**: 2024-11-12
**Status**: In Progress

