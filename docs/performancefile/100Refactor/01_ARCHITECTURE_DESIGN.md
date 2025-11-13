# GameHub 100% 重构 - 架构设计详解

## 🏗️ 新架构概览

### 核心设计原则

1. **单一职责** - 每个包只做一件事
2. **高内聚** - 相关功能紧密组织
3. **低耦合** - 包之间依赖最小化
4. **可测试** - 每个模块都可独立测试
5. **可扩展** - 易于添加新功能和平台

---

## 📦 Monorepo 结构详解

### 1. 共享包 (`packages/shared`)

#### 1.1 API 层 (`packages/shared/api`)

```typescript
// packages/shared/api/client.ts
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryCount: number;
  retryDelay: number;
}

export class ApiClient {
  private instance: AxiosInstance;
  
  constructor(config: ApiConfig) {
    this.instance = axios.create(config);
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    );
    
    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => response.data,
      (error) => this.handleError(error)
    );
  }
  
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config);
  }
  
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, data, config);
  }
  
  // ... 其他方法
}

// packages/shared/api/games.api.ts
export class GamesApi {
  constructor(private client: ApiClient) {}
  
  async getGames(params: GetGamesParams): Promise<PaginatedResponse<Game>> {
    return this.client.get('/games', { params });
  }
  
  async getGameById(id: string): Promise<Game> {
    return this.client.get(`/games/${id}`);
  }
  
  async searchGames(keyword: string): Promise<Game[]> {
    return this.client.get('/games/search', { params: { q: keyword } });
  }
}

// packages/shared/api/index.ts
export { ApiClient, GamesApi, AuthApi, UserApi };
export type { ApiConfig, Game, User, Auth };
```

#### 1.2 类型定义 (`packages/shared/types`)

```typescript
// packages/shared/types/game.ts
export interface Game {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  source: 'rawg' | 'itch' | 'igdb';
  sourceId: string;
  sourceUrl: string;
  genres: string[];
  platforms: string[];
  releaseDate: string;
  rating: number;
  playCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetGamesParams {
  page?: number;
  limit?: number;
  search?: string;
  source?: string;
  sort?: 'popular' | 'latest' | 'rating';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// packages/shared/types/user.ts
export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar: string;
  role: 'user' | 'admin';
  pointBalance: number;
  membershipTier: 'free' | 'silver' | 'gold' | 'platinum';
  createdAt: string;
  updatedAt: string;
}

export interface Auth {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}
```

#### 1.3 状态管理 (`packages/shared/stores`)

```typescript
// packages/shared/stores/gameStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface GameState {
  games: Game[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchGames: (params: GetGamesParams) => Promise<void>;
  setGames: (games: Game[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useGameStore = create<GameState>()(
  devtools(
    persist(
      (set) => ({
        games: [],
        loading: false,
        error: null,
        
        fetchGames: async (params) => {
          set({ loading: true, error: null });
          try {
            const response = await gamesApi.getGames(params);
            set({ games: response.data });
          } catch (error) {
            set({ error: error.message });
          } finally {
            set({ loading: false });
          }
        },
        
        setGames: (games) => set({ games }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
      }),
      { name: 'game-store' }
    )
  )
);
```

#### 1.4 工具函数 (`packages/shared/utils`)

```typescript
// packages/shared/utils/performance.ts
export class PerformanceMonitor {
  static mark(name: string) {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(name);
    }
  }
  
  static measure(name: string, startMark: string, endMark: string) {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.measure(name, startMark, endMark);
      const measure = window.performance.getEntriesByName(name)[0];
      console.log(`${name}: ${measure.duration.toFixed(2)}ms`);
    }
  }
  
  static getMetrics() {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.timing;
      return {
        fcp: navigation.responseEnd - navigation.navigationStart,
        lcp: navigation.loadEventEnd - navigation.navigationStart,
        ttfb: navigation.responseStart - navigation.navigationStart,
      };
    }
    return null;
  }
}

// packages/shared/utils/image.ts
export class ImageOptimizer {
  static getOptimizedUrl(
    baseUrl: string,
    width: number,
    quality: number = 80
  ): string {
    const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
    const targetWidth = Math.ceil(width * pixelRatio);
    const format = this.getSupportedFormat();
    return `${baseUrl}?w=${targetWidth}&q=${quality}&format=${format}`;
  }
  
  static getSupportedFormat(): 'webp' | 'jpeg' {
    if (typeof window === 'undefined') return 'jpeg';
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
      ? 'webp'
      : 'jpeg';
  }
}
```

#### 1.5 自定义 Hooks (`packages/shared/hooks`)

```typescript
// packages/shared/hooks/useAsync.ts
export function useAsync<T, E = string>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setValue(null);
    setError(null);
    try {
      const response = await asyncFunction();
      setValue(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error as E);
      setStatus('error');
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, value, error };
}

// packages/shared/hooks/useInfiniteScroll.ts
export function useInfiniteScroll(
  fetchMore: () => Promise<void>,
  options: { threshold?: number } = {}
) {
  const { threshold = 0.1 } = options;
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchMore();
        }
      },
      { threshold }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [fetchMore, threshold]);

  return observerTarget;
}
```

---

### 2. Web 应用 (`packages/web`)

#### 2.1 项目结构

```
packages/web/
├── src/
│   ├── components/
│   │   ├── common/           # 通用组件
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Loading.tsx
│   │   ├── business/         # 业务组件
│   │   │   ├── GameCard.tsx
│   │   │   ├── GameList.tsx
│   │   │   └── UserProfile.tsx
│   │   └── layout/           # 布局组件
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── Sidebar.tsx
│   │
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── GamesPage.tsx
│   │   ├── GameDetailPage.tsx
│   │   └── ProfilePage.tsx
│   │
│   ├── stores/               # 状态管理
│   │   ├── gameStore.ts
│   │   ├── userStore.ts
│   │   └── index.ts
│   │
│   ├── services/             # 业务逻辑
│   │   ├── gameService.ts
│   │   ├── userService.ts
│   │   └── index.ts
│   │
│   ├── hooks/                # 自定义Hooks
│   │   ├── useGames.ts
│   │   ├── useUser.ts
│   │   └── index.ts
│   │
│   ├── styles/               # 样式
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── theme.ts
│   │
│   ├── utils/                # 工具函数
│   │   ├── format.ts
│   │   ├── validate.ts
│   │   └── index.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── public/
│   ├── index.html
│   └── service-worker.js
│
├── vite.config.ts
├── tsconfig.json
└── package.json
```

#### 2.2 核心组件示例

```typescript
// packages/web/src/components/business/GameCard.tsx
import { memo } from 'react';
import { Game } from '@gamehub/shared/types';
import { ImageOptimizer } from '@gamehub/shared/utils';
import styles from './GameCard.module.css';

interface GameCardProps {
  game: Game;
  onClick?: (game: Game) => void;
}

export const GameCard = memo(({ game, onClick }: GameCardProps) => {
  const imageUrl = ImageOptimizer.getOptimizedUrl(game.coverImageUrl, 200);
  
  return (
    <div className={styles.card} onClick={() => onClick?.(game)}>
      <img
        src={imageUrl}
        alt={game.title}
        loading="lazy"
        decoding="async"
        className={styles.image}
      />
      <div className={styles.content}>
        <h3 className={styles.title}>{game.title}</h3>
        <p className={styles.description}>{game.description}</p>
        <div className={styles.meta}>
          <span className={styles.rating}>⭐ {game.rating}</span>
          <span className={styles.plays}>👥 {game.playCount}</span>
        </div>
      </div>
    </div>
  );
});

GameCard.displayName = 'GameCard';
```

#### 2.3 页面示例

```typescript
// packages/web/src/pages/GamesPage.tsx
import { useState, useCallback, useRef } from 'react';
import { useGameStore } from '@gamehub/shared/stores';
import { useInfiniteScroll } from '@gamehub/shared/hooks';
import { GameCard } from '../components/business/GameCard';
import styles from './GamesPage.module.css';

export function GamesPage() {
  const { games, fetchGames } = useGameStore();
  const [page, setPage] = useState(1);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const handleLoadMore = useCallback(async () => {
    await fetchGames({ page: page + 1 });
    setPage(p => p + 1);
  }, [page, fetchGames]);
  
  useInfiniteScroll(handleLoadMore);
  
  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
      <div ref={observerTarget} className={styles.observer} />
    </div>
  );
}
```

---

### 3. 移动应用 (`packages/mobile`)

#### 3.1 项目结构

```
packages/mobile/
├── src/
│   ├── components/           # 可复用组件
│   │   ├── GameCard.tsx
│   │   ├── Button.tsx
│   │   └── Loading.tsx
│   │
│   ├── screens/              # 屏幕
│   │   ├── HomeScreen.tsx
│   │   ├── GamesScreen.tsx
│   │   └── ProfileScreen.tsx
│   │
│   ├── navigation/           # 导航
│   │   └── RootNavigator.tsx
│   │
│   ├── stores/               # 状态管理（共享）
│   ├── services/             # 业务逻辑（共享）
│   ├── utils/                # 工具函数（共享）
│   │
│   ├── App.tsx
│   └── index.tsx
│
├── android/
├── ios/
├── package.json
└── app.json
```

#### 3.2 核心屏幕示例

```typescript
// packages/mobile/src/screens/GamesScreen.tsx
import { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { useGameStore } from '@gamehub/shared/stores';
import { GameCard } from '../components/GameCard';
import styles from './GamesScreen.module.css';

export function GamesScreen() {
  const { games, fetchGames } = useGameStore();
  
  const handleLoadMore = useCallback(() => {
    fetchGames({ page: games.length / 12 + 1 });
  }, [games.length, fetchGames]);
  
  return (
    <View style={styles.container}>
      <FlatList
        data={games}
        renderItem={({ item }) => <GameCard game={item} />}
        keyExtractor={(item) => item.id}
        onEndReached={handleLoadMore}
        numColumns={2}
      />
    </View>
  );
}
```

---

### 4. 后端应用 (`packages/backend`)

#### 4.1 模块化结构

```
packages/backend/
├── src/
│   ├── modules/
│   │   ├── games/
│   │   │   ├── entities/
│   │   │   ├── dtos/
│   │   │   ├── services/
│   │   │   ├── controllers/
│   │   │   └── games.module.ts
│   │   │
│   │   ├── users/
│   │   │   ├── entities/
│   │   │   ├── dtos/
│   │   │   ├── services/
│   │   │   ├── controllers/
│   │   │   └── users.module.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── strategies/
│   │   │   ├── guards/
│   │   │   ├── services/
│   │   │   ├── controllers/
│   │   │   └── auth.module.ts
│   │   │
│   │   └── aggregation/
│   │       ├── services/
│   │       ├── tasks/
│   │       └── aggregation.module.ts
│   │
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── data-source.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── guards/
│   │
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── cache.config.ts
│   │   └── env.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
└── package.json
```

#### 4.2 优化的 API 端点

```typescript
// packages/backend/src/modules/games/controllers/games.controller.ts
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { GamesService } from '../services/games.service';
import { GetGamesDto } from '../dtos/get-games.dto';

@Controller('games')
@UseInterceptors(CacheInterceptor)
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @CacheTTL(300) // 5分钟缓存
  async getGames(@Query() query: GetGamesDto) {
    return this.gamesService.getGames(query);
  }

  @Get(':id')
  @CacheTTL(600) // 10分钟缓存
  async getGameById(@Param('id') id: string) {
    return this.gamesService.getGameById(id);
  }
}
```

---

## 🔄 数据流架构

### 单向数据流

```
用户交互
    ↓
组件事件处理
    ↓
调用 Store Action
    ↓
Store 调用 API Service
    ↓
API Service 调用 ApiClient
    ↓
后端 API
    ↓
数据库
    ↓
响应数据
    ↓
Store 更新状态
    ↓
组件重新渲染
```

### 缓存策略

```
请求
  ↓
检查内存缓存 (Zustand)
  ↓ (未命中)
检查本地存储缓存 (localStorage)
  ↓ (未命中)
检查 HTTP 缓存 (Service Worker)
  ↓ (未命中)
发送网络请求
  ↓
更新所有缓存层
  ↓
返回数据
```

---

## 🔐 安全架构

### 认证流程

```
登录请求
  ↓
验证用户凭证
  ↓
生成 JWT Token
  ↓
返回 Access Token + Refresh Token
  ↓
客户端存储 Token
  ↓
后续请求在 Header 中携带 Token
  ↓
服务器验证 Token
  ↓
允许/拒绝请求
```

### 授权策略

```
用户请求
  ↓
检查用户角色
  ↓
检查资源权限
  ↓
检查操作权限
  ↓
允许/拒绝操作
```

---

## 📊 性能优化架构

### 前端优化

1. **代码分割** - 按路由分割
2. **图片优化** - 响应式图片、WebP 格式
3. **虚拟滚动** - 大列表优化
4. **缓存策略** - 多层缓存
5. **懒加载** - 按需加载资源

### 后端优化

1. **数据库索引** - 优化查询性能
2. **缓存层** - Redis 缓存
3. **API 分页** - 减少数据传输
4. **异步处理** - 后台任务
5. **CDN** - 静态资源加速

---

## 📈 可扩展性设计

### 水平扩展

```
负载均衡器
    ↓
┌───────┬───────┬───────┐
↓       ↓       ↓       ↓
API1   API2   API3   API4
    ↓
┌───────────────────────┐
│   数据库主从复制      │
└───────────────────────┘
```

### 垂直扩展

```
微服务架构
├── 用户服务
├── 游戏服务
├── 聚合服务
├── 推荐服务
└── 分析服务
```

---

**下一步：** 查看 `02_PERFORMANCE_OPTIMIZATION.md` 了解详细的性能优化策略

