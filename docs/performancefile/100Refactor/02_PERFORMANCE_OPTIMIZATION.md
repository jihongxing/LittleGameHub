# GameHub 100% 重构 - 性能优化策略

## 🎯 性能优化目标

| 指标 | 当前 | 目标 | 优化方案 |
|------|------|------|---------|
| 首屏加载时间 | 3.5s | 0.8s | 代码分割、预加载、缓存 |
| 包体积 | 2.8MB | 0.6MB | Tree-shaking、压缩、分割 |
| 内存占用 | 120MB | 40MB | 虚拟滚动、懒加载、GC优化 |
| Lighthouse | 45 | 95 | 全面优化 |
| FCP | 2.0s | 0.5s | 关键路径优化 |
| LCP | 3.2s | 1.2s | 图片优化、预加载 |
| CLS | 0.25 | 0.05 | 布局稳定性 |

---

## 🚀 前端性能优化

### 1. 代码分割策略

#### 1.1 路由级代码分割

```typescript
// packages/web/src/App.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// 动态导入页面
const HomePage = lazy(() => import('./pages/HomePage'));
const GamesPage = lazy(() => import('./pages/GamesPage'));
const GameDetailPage = lazy(() => import('./pages/GameDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// 加载占位符
function LoadingFallback() {
  return (
    <div className="loading-skeleton">
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/:id" element={<GameDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Suspense>
  );
}
```

**预期效果：** 初始包体积减少 40-50%

#### 1.2 组件级代码分割

```typescript
// packages/web/src/components/business/GameList.tsx
import { lazy, Suspense } from 'react';

// 高级过滤器组件按需加载
const AdvancedFilters = lazy(() => import('./AdvancedFilters'));

export function GameList() {
  const [showFilters, setShowFilters] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowFilters(!showFilters)}>
        高级过滤
      </button>
      
      {showFilters && (
        <Suspense fallback={<div>加载中...</div>}>
          <AdvancedFilters />
        </Suspense>
      )}
    </div>
  );
}
```

#### 1.3 Vite 配置优化

```typescript
// packages/web/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  
  build: {
    target: 'ES2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    rollupOptions: {
      output: {
        manualChunks: {
          // 将第三方库分离
          'vendor': [
            'react',
            'react-dom',
            'react-router-dom',
            'zustand',
          ],
          'ui': [
            'antd',
            '@ant-design/icons',
          ],
          'utils': [
            'axios',
            'date-fns',
            'lodash-es',
          ],
        },
      },
    },
    
    // 关键路径优化
    cssCodeSplit: true,
    sourcemap: false,
    
    // 分块大小警告
    chunkSizeWarningLimit: 500,
  },
  
  // 预加载优化
  ssr: {
    noExternal: ['@gamehub/shared'],
  },
});
```

**预期效果：** 包体积减少 30-40%，加载时间减少 20-30%

---

### 2. 图片优化

#### 2.1 响应式图片

```typescript
// packages/shared/utils/image.ts
export class ImageOptimizer {
  // 生成响应式图片 URL
  static generateSrcSet(baseUrl: string, widths: number[] = [200, 400, 600, 800]): string {
    return widths
      .map((width) => `${this.getOptimizedUrl(baseUrl, width)} ${width}w`)
      .join(', ');
  }

  // 获取优化后的 URL
  static getOptimizedUrl(
    baseUrl: string,
    width: number,
    quality: number = 80
  ): string {
    const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
    const targetWidth = Math.ceil(width * pixelRatio);
    const format = this.getSupportedFormat();
    
    return `${baseUrl}?w=${targetWidth}&q=${quality}&format=${format}&auto=format`;
  }

  // 检测浏览器支持的格式
  static getSupportedFormat(): 'webp' | 'avif' | 'jpeg' {
    if (typeof window === 'undefined') return 'jpeg';
    
    const canvas = document.createElement('canvas');
    
    // 检测 AVIF 支持
    if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
      return 'avif';
    }
    
    // 检测 WebP 支持
    if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
      return 'webp';
    }
    
    return 'jpeg';
  }

  // 获取占位图
  static getPlaceholder(baseUrl: string): string {
    return `${baseUrl}?w=10&q=10&blur=10`;
  }
}
```

#### 2.2 图片组件

```typescript
// packages/web/src/components/common/OptimizedImage.tsx
import { useState } from 'react';
import { ImageOptimizer } from '@gamehub/shared/utils';
import styles from './OptimizedImage.module.css';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const srcSet = ImageOptimizer.generateSrcSet(src);
  const placeholder = ImageOptimizer.getPlaceholder(src);

  return (
    <div className={styles.container} style={{ width, height }}>
      {/* 占位图 */}
      <img
        src={placeholder}
        alt={alt}
        className={`${styles.image} ${styles.placeholder}`}
        aria-hidden="true"
      />

      {/* 实际图片 */}
      <img
        srcSet={srcSet}
        src={ImageOptimizer.getOptimizedUrl(src, width)}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${styles.image} ${isLoaded ? styles.loaded : ''}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsError(true)}
      />

      {/* 错误处理 */}
      {isError && (
        <div className={styles.error}>
          <span>图片加载失败</span>
        </div>
      )}
    </div>
  );
}
```

**预期效果：** 图片加载速度提升 3-5 倍

---

### 3. 虚拟滚动优化

#### 3.1 虚拟列表实现

```typescript
// packages/web/src/components/business/VirtualGameList.tsx
import { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-window-auto-sizer';
import { Game } from '@gamehub/shared/types';
import { GameCard } from './GameCard';
import styles from './VirtualGameList.module.css';

interface VirtualGameListProps {
  games: Game[];
  onLoadMore: () => void;
}

export function VirtualGameList({ games, onLoadMore }: VirtualGameListProps) {
  const itemCount = games.length;
  const itemSize = 280; // 卡片高度 + 间距

  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      // 当接近底部时加载更多
      if (index === itemCount - 5) {
        onLoadMore();
      }

      return (
        <div style={style} className={styles.row}>
          <GameCard game={games[index]} />
        </div>
      );
    },
    [games, itemCount, onLoadMore]
  );

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          itemCount={itemCount}
          itemSize={itemSize}
          width={width}
          className={styles.list}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
}
```

**预期效果：** 支持 10000+ 项无卡顿滚动

---

### 4. 缓存策略

#### 4.1 多层缓存架构

```typescript
// packages/shared/utils/cache.ts
export class CacheManager {
  // 内存缓存
  private static memoryCache = new Map<string, { data: any; expiry: number }>();

  // 获取缓存
  static get<T>(key: string): T | null {
    const cached = this.memoryCache.get(key);
    
    if (!cached) return null;
    
    // 检查过期
    if (Date.now() > cached.expiry) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  // 设置缓存
  static set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000) {
    this.memoryCache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  }

  // 清除缓存
  static clear(key?: string) {
    if (key) {
      this.memoryCache.delete(key);
    } else {
      this.memoryCache.clear();
    }
  }
}

// 本地存储缓存
export class LocalStorageCache {
  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const { data, expiry } = JSON.parse(item);
      
      if (Date.now() > expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      return data as T;
    } catch {
      return null;
    }
  }

  static set<T>(key: string, data: T, ttl: number = 24 * 60 * 60 * 1000) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          data,
          expiry: Date.now() + ttl,
        })
      );
    } catch {
      // 存储空间不足
    }
  }
}
```

#### 4.2 Service Worker 缓存

```javascript
// packages/web/public/service-worker.js
const CACHE_NAME = 'gamehub-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// 安装事件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// 激活事件
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// 获取事件
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 缓存策略：网络优先，失败时使用缓存
  if (request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 缓存成功的响应
          if (response.status === 200) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // 网络失败，返回缓存
          return caches.match(request);
        })
    );
  }
});
```

**预期效果：** 离线可访问，弱网环境友好

---

## 🔧 后端性能优化

### 1. 数据库优化

#### 1.1 索引优化

```sql
-- 创建复合索引
CREATE INDEX idx_games_source_rating ON games(source, rating DESC);

-- 创建 GIN 索引用于 JSONB 查询
CREATE INDEX idx_games_genres ON games USING GIN(genres);
CREATE INDEX idx_games_platforms ON games USING GIN(platforms);

-- 创建唯一索引
CREATE UNIQUE INDEX idx_games_source_id ON games(source, source_id);
```

#### 1.2 查询优化

```typescript
// packages/backend/src/modules/games/services/games.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Game } from '../entities/game.entity';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private readonly gamesRepository: Repository<Game>,
  ) {}

  // 优化的查询
  async getGames(params: GetGamesDto) {
    const query = this.gamesRepository.createQueryBuilder('game');

    // 只查询需要的字段
    query.select([
      'game.id',
      'game.title',
      'game.coverImageUrl',
      'game.rating',
      'game.playCount',
    ]);

    // 应用过滤条件
    if (params.search) {
      query.where('game.title ILIKE :search', {
        search: `%${params.search}%`,
      });
    }

    if (params.source) {
      query.andWhere('game.source = :source', { source: params.source });
    }

    if (params.minRating) {
      query.andWhere('game.rating >= :minRating', {
        minRating: params.minRating,
      });
    }

    // 排序
    query.orderBy('game.rating', 'DESC');

    // 分页
    const page = params.page || 1;
    const limit = Math.min(params.limit || 12, 100);
    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
```

### 2. 缓存优化

#### 2.1 Redis 缓存

```typescript
// packages/backend/src/config/cache.config.ts
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

export const cacheConfig = CacheModule.register({
  isGlobal: true,
  store: redisStore,
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  ttl: 5 * 60, // 5分钟
});
```

#### 2.2 缓存装饰器

```typescript
// packages/backend/src/common/decorators/cache.decorator.ts
import { UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

export function CacheResponse(ttl: number = 300) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    UseInterceptors(CacheInterceptor)(target, propertyKey, descriptor);
    CacheTTL(ttl)(target, propertyKey, descriptor);
    return descriptor;
  };
}
```

#### 2.3 使用缓存

```typescript
// packages/backend/src/modules/games/controllers/games.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { CacheResponse } from '../../../common/decorators/cache.decorator';
import { GamesService } from '../services/games.service';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @CacheResponse(300) // 5分钟缓存
  async getGames(@Query() query: GetGamesDto) {
    return this.gamesService.getGames(query);
  }

  @Get(':id')
  @CacheResponse(600) // 10分钟缓存
  async getGameById(@Param('id') id: string) {
    return this.gamesService.getGameById(id);
  }
}
```

### 3. 异步处理

```typescript
// packages/backend/src/tasks/sync-games.task.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GameAggregationService } from '../services/game-aggregation.service';

@Injectable()
export class SyncGamesTask {
  private readonly logger = new Logger(SyncGamesTask.name);

  constructor(
    private readonly gameAggregationService: GameAggregationService,
  ) {}

  // 每天凌晨2点执行
  @Cron('0 2 * * *')
  async syncGames() {
    this.logger.log('开始同步游戏...');
    
    try {
      await this.gameAggregationService.syncAllSources();
      this.logger.log('游戏同步完成');
    } catch (error) {
      this.logger.error('游戏同步失败', error);
    }
  }
}
```

---

## 📊 性能监控

### 1. 前端监控

```typescript
// packages/shared/utils/performance.ts
export class PerformanceMonitor {
  static reportMetrics() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const metrics = window.performance.getEntriesByType('navigation')[0];
      
      const data = {
        url: window.location.href,
        fcp: metrics.responseEnd - metrics.navigationStart,
        lcp: this.getLCP(),
        cls: this.getCLS(),
        ttfb: metrics.responseStart - metrics.navigationStart,
        timestamp: new Date().toISOString(),
      };

      // 发送到分析服务
      this.sendToAnalytics(data);
    });
  }

  private static getLCP(): number {
    const entries = window.performance.getEntriesByType('largest-contentful-paint');
    return entries.length > 0 ? entries[entries.length - 1].renderTime : 0;
  }

  private static getCLS(): number {
    let cls = 0;
    const entries = window.performance.getEntriesByType('layout-shift');
    
    for (const entry of entries) {
      if (!(entry as any).hadRecentInput) {
        cls += (entry as any).value;
      }
    }
    
    return cls;
  }

  private static sendToAnalytics(data: any) {
    navigator.sendBeacon('/api/analytics/metrics', JSON.stringify(data));
  }
}

// 在应用启动时调用
PerformanceMonitor.reportMetrics();
```

### 2. 后端监控

```typescript
// packages/backend/src/common/interceptors/performance.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.getRequest();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        
        // 记录性能数据
        console.log(`${request.method} ${request.url} - ${duration}ms`);
        
        // 如果响应时间过长，发送警告
        if (duration > 1000) {
          console.warn(`Slow request: ${request.url} took ${duration}ms`);
        }
      }),
    );
  }
}
```

---

## 🎯 性能优化检查清单

### 第1周
- [ ] 实现代码分割
- [ ] 优化图片加载
- [ ] 配置 Service Worker
- [ ] 首屏加载时间 < 1.5s

### 第2周
- [ ] 实现虚拟滚动
- [ ] 配置缓存策略
- [ ] 优化数据库查询
- [ ] 包体积 < 1.2MB

### 第3周
- [ ] 配置 Redis 缓存
- [ ] 实现性能监控
- [ ] 优化 API 响应
- [ ] Lighthouse 评分 > 90

### 第4周
- [ ] 完整的性能测试
- [ ] 文档完善
- [ ] 部署到生产环境
- [ ] 持续监控

---

**下一步：** 查看 `03_MONOREPO_MIGRATION.md` 了解 Monorepo 迁移指南

