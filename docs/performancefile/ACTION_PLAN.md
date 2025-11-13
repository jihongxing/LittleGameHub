# GameHub 三端统一 - 具体行动计划

## 🎯 目标

在保持现有项目结构不变的前提下，实现Web、iOS、Android三端统一，性能优异。

---

## 📅 完整行动计划

### 第1周：Web端性能优化

#### Day 1-2：代码分割 + 图片优化

**任务1：代码分割**

文件：`frontend/src/App.tsx`

```typescript
// 改动前
import GameListPage from './pages/GameListPage';
import GameDetailPage from './pages/GameDetailPage';

// 改动后
import { lazy, Suspense } from 'react';

const GameListPage = lazy(() => import('./pages/GameListPage'));
const GameDetailPage = lazy(() => import('./pages/GameDetailPage'));

function LoadingFallback() {
  return <div>加载中...</div>;
}

export function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<GameListPage />} />
        <Route path="/game/:id" element={<GameDetailPage />} />
      </Routes>
    </Suspense>
  );
}
```

**验证方法：**
```bash
# 检查包体积是否减少
npm run build
# 查看dist文件夹，应该有多个chunk文件
```

**预期效果：** 首屏包体积减少 40-50%

---

**任务2：图片优化**

创建文件：`frontend/src/utils/imageOptimizer.ts`

```typescript
export class ImageOptimizer {
  static getOptimizedUrl(
    baseUrl: string,
    width: number,
    quality: number = 80
  ): string {
    const pixelRatio = window.devicePixelRatio || 1;
    const targetWidth = Math.ceil(width * pixelRatio);
    const sizes = [200, 400, 600, 800, 1200];
    const optimalSize = sizes.find(size => size >= targetWidth) || 1200;
    const format = this.getSupportedFormat();
    return `${baseUrl}?w=${optimalSize}&q=${quality}&format=${format}`;
  }

  static getSupportedFormat(): 'webp' | 'jpeg' {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
      ? 'webp'
      : 'jpeg';
  }
}
```

修改文件：`frontend/src/components/GameCard.tsx`

```typescript
import { ImageOptimizer } from '../utils/imageOptimizer';

export function GameCard({ game }) {
  const optimizedUrl = ImageOptimizer.getOptimizedUrl(game.coverUrl, 200);
  
  return (
    <div>
      <img 
        src={optimizedUrl}
        alt={game.title}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
```

**验证方法：**
```bash
# 打开Chrome DevTools -> Network
# 检查图片大小，应该比原来小 50-70%
```

**预期效果：** 图片加载速度提升 3-5倍

---

#### Day 3-4：虚拟滚动 + Service Worker

**任务3：虚拟滚动**

```bash
cd frontend
pnpm add react-window
pnpm add -D @types/react-window
```

创建文件：`frontend/src/components/VirtualGameList.tsx`

```typescript
import React from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

export function VirtualGameList({ games, onGameClick }) {
  const Row = ({ index, style }) => (
    <div style={style} onClick={() => onGameClick(games[index])}>
      <GameCard game={games[index]} />
    </div>
  );

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          itemCount={games.length}
          itemSize={320}
          width={width}
          overscanCount={3}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
}
```

修改文件：`frontend/src/pages/GameListPage.tsx`

```typescript
import { VirtualGameList } from '../components/VirtualGameList';

export function GameListPage() {
  const [games, setGames] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGames().then(setGames);
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      <VirtualGameList 
        games={games}
        onGameClick={(game) => navigate(`/game/${game.id}`)}
      />
    </div>
  );
}
```

**验证方法：**
```bash
# 打开Chrome DevTools -> Performance
# 滚动列表，检查帧率是否稳定在60fps
```

**预期效果：** 支持10000+项无卡顿

---

**任务4：Service Worker**

创建文件：`frontend/public/service-worker.js`

```javascript
const CACHE_VERSION = 'v1';
const CACHE_NAME = `gamehub-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  // 图片：缓存优先
  if (request.destination === 'image') {
    event.respondWith(
      caches.open('images').then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // API：网络优先
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            caches.open('api').then((cache) => {
              cache.put(request, response.clone());
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // 其他：Stale While Revalidate
  event.respondWith(
    caches.match(request).then((response) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
          });
        }
        return response;
      });
      return response || fetchPromise;
    })
  );
});
```

修改文件：`frontend/src/main.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 注册Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
```

**验证方法：**
```bash
# 打开Chrome DevTools -> Application -> Service Workers
# 检查Service Worker是否已注册
# 断网后刷新页面，应该仍能访问缓存的资源
```

**预期效果：** 离线可访问，弱网环境友好

---

#### Day 5：性能测试和部署

**任务5：性能测试**

```bash
# 使用Lighthouse测试
npm run build
npx http-server dist
# 打开 http://localhost:8080
# Chrome DevTools -> Lighthouse -> Generate report
```

**检查清单：**
- [ ] 首屏加载时间 < 1.5s
- [ ] 包体积 < 1.2MB
- [ ] Lighthouse Performance > 90
- [ ] 列表滚动 60fps
- [ ] Service Worker已注册

**预期效果：**
| 指标 | 优化前 | 优化后 | 提升 |
|------|-------|-------|------|
| 首屏加载 | 3.5s | 1.2s | 66% |
| 包体积 | 2.8MB | 1.1MB | 61% |
| 内存占用 | 120MB | 70MB | 42% |

---

### 第2周：API层提取 + 请求优化

#### Day 1-2：提取API层

**任务1：创建统一API客户端**

创建文件：`frontend/src/api/client.ts`

```typescript
import axios, { AxiosInstance } from 'axios';

export class APIClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: any): Promise<T> {
    return this.client.get(url, config);
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.post(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.put(url, data, config);
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    return this.client.delete(url, config);
  }
}

export const apiClient = new APIClient(
  process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
);
```

**任务2：创建业务API**

创建文件：`frontend/src/api/games.api.ts`

```typescript
import { apiClient } from './client';

export interface Game {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  rating: number;
  downloads: number;
}

export const gamesAPI = {
  getGames: (page = 1, limit = 20) =>
    apiClient.get<{ data: Game[]; total: number }>('/games', {
      params: { page, limit },
    }),

  getGameById: (id: string) =>
    apiClient.get<Game>(`/games/${id}`),

  searchGames: (keyword: string) =>
    apiClient.get<Game[]>('/games/search', {
      params: { q: keyword },
    }),
};
```

创建文件：`frontend/src/api/auth.api.ts`

```typescript
import { apiClient } from './client';

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authAPI = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<{ user: User; token: string }>('/auth/login', credentials),

  logout: () =>
    apiClient.post('/auth/logout'),

  getCurrentUser: () =>
    apiClient.get<User>('/auth/me'),
};
```

**任务3：修改现有代码使用API层**

修改文件：`frontend/src/pages/GameListPage.tsx`

```typescript
// 改动前
useEffect(() => {
  fetch('/api/games')
    .then(r => r.json())
    .then(setGames);
}, []);

// 改动后
import { gamesAPI } from '../api/games.api';

useEffect(() => {
  gamesAPI.getGames().then(({ data }) => setGames(data));
}, []);
```

**验证方法：**
```bash
# 运行应用，检查API调用是否正常
npm run dev
# 打开Chrome DevTools -> Network
# 检查API请求是否成功
```

---

#### Day 3-4：请求优化

**任务4：请求合并**

创建文件：`frontend/src/api/batchRequest.ts`

```typescript
interface PendingRequest {
  endpoint: string;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export class BatchRequestManager {
  private queue: PendingRequest[] = [];
  private timer: NodeJS.Timeout | null = null;

  request<T>(endpoint: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ endpoint, resolve, reject });

      if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), 50);
      }
    });
  }

  private async flush() {
    const batch = [...this.queue];
    this.queue = [];
    this.timer = null;

    if (batch.length === 0) return;

    try {
      if (batch.length === 1) {
        const { endpoint, resolve } = batch[0];
        const response = await fetch(endpoint);
        const data = await response.json();
        resolve(data);
        return;
      }

      const response = await fetch('/api/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: batch.map(r => r.endpoint),
        }),
      });

      const results = await response.json();
      batch.forEach((req, index) => {
        req.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(req => req.reject(error));
    }
  }
}

export const batchRequestManager = new BatchRequestManager();
```

**验证方法：**
```bash
# 打开Chrome DevTools -> Network
# 检查多个API请求是否被合并为一个
```

---

#### Day 5：测试和部署

**任务5：集成测试**

```bash
# 测试所有API调用
npm run test

# 测试性能
npm run build
npx http-server dist
```

**检查清单：**
- [ ] 所有API调用正常
- [ ] 请求合并工作正常
- [ ] 性能指标达标
- [ ] 没有控制台错误

---

### 第3-8周：开发移动端（可与前面并行）

#### 初始化项目

```bash
# 创建React Native项目
npx react-native init mobile --template react-native-template-typescript

cd mobile

# 安装依赖
pnpm add @react-navigation/native @react-navigation/native-stack
pnpm add react-native-screens react-native-safe-area-context
pnpm add react-native-fast-image
pnpm add zustand

# 复制API层和类型
cp -r ../frontend/src/api src/
cp -r ../frontend/src/types src/
```

#### 实现核心功能

**创建导航结构：** `mobile/src/navigation/RootNavigator.tsx`

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '../screens/LoginScreen';
import { GameListScreen } from '../screens/GameListScreen';
import { GameDetailScreen } from '../screens/GameDetailScreen';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="GameList" component={GameListScreen} />
        <Stack.Screen name="GameDetail" component={GameDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

**创建游戏列表屏幕：** `mobile/src/screens/GameListScreen.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { gamesAPI } from '../api/games.api';
import { GameCard } from '../components/GameCard';

export function GameListScreen({ navigation }) {
  const [games, setGames] = useState([]);

  useEffect(() => {
    gamesAPI.getGames().then(({ data }) => setGames(data));
  }, []);

  return (
    <FlatList
      data={games}
      renderItem={({ item }) => (
        <GameCard 
          game={item}
          onPress={() => navigation.navigate('GameDetail', { id: item.id })}
        />
      )}
      keyExtractor={(item) => item.id}
      maxToRenderPerBatch={10}
      initialNumToRender={10}
      windowSize={5}
    />
  );
}
```

---

## ✅ 完整检查清单

### 第1周检查清单

- [ ] **代码分割**
  - [ ] App.tsx已修改
  - [ ] 使用lazy()和Suspense
  - [ ] 包体积减少40%+

- [ ] **图片优化**
  - [ ] imageOptimizer.ts已创建
  - [ ] GameCard.tsx已修改
  - [ ] 图片加载速度提升3-5倍

- [ ] **虚拟滚动**
  - [ ] react-window已安装
  - [ ] VirtualGameList.tsx已创建
  - [ ] 列表滚动60fps

- [ ] **Service Worker**
  - [ ] service-worker.js已创建
  - [ ] main.tsx已注册
  - [ ] 离线可访问

- [ ] **性能测试**
  - [ ] 首屏加载 < 1.5s
  - [ ] 包体积 < 1.2MB
  - [ ] Lighthouse > 90

### 第2周检查清单

- [ ] **API层提取**
  - [ ] client.ts已创建
  - [ ] games.api.ts已创建
  - [ ] auth.api.ts已创建

- [ ] **现有代码改动**
  - [ ] GameListPage.tsx已修改
  - [ ] 所有API调用已迁移
  - [ ] 没有控制台错误

- [ ] **请求优化**
  - [ ] batchRequest.ts已创建
  - [ ] HTTP请求数减少70%
  - [ ] 网络往返时间减少60%

- [ ] **集成测试**
  - [ ] 所有API调用正常
  - [ ] 性能指标达标
  - [ ] 可以部署到生产环境

### 第3-8周检查清单

- [ ] **移动端项目**
  - [ ] React Native项目已初始化
  - [ ] 依赖已安装
  - [ ] API层已复制

- [ ] **核心功能**
  - [ ] 登录功能实现
  - [ ] 游戏列表实现
  - [ ] 游戏详情实现

- [ ] **性能优化**
  - [ ] 列表虚拟化
  - [ ] 图片缓存
  - [ ] 内存优化

- [ ] **测试和发布**
  - [ ] iOS应用已打包
  - [ ] Android应用已打包
  - [ ] 已提交到应用商店

---

## 📊 进度跟踪

### 周进度表

| 周次 | 任务 | 完成度 | 备注 |
|------|------|--------|------|
| 第1周 | Web端性能优化 | 0% → 100% | 立竿见影 |
| 第2周 | API层提取 + 请求优化 | 0% → 100% | 为移动端准备 |
| 第3-4周 | 移动端基础框架 | 0% → 100% | 可并行进行 |
| 第5-6周 | 移动端核心功能 | 0% → 100% | 可并行进行 |
| 第7周 | 性能优化和测试 | 0% → 100% | 可并行进行 |
| 第8周 | 发布和上线 | 0% → 100% | 三端统一完成 |

---

## 🎯 成功标准

### 第1周目标
- ✅ 首屏加载时间 < 1.5s
- ✅ 包体积 < 1.2MB
- ✅ 列表滚动 60fps
- ✅ Service Worker已注册

### 第2周目标
- ✅ API层完全提取
- ✅ HTTP请求数减少70%
- ✅ 现有代码改动最小化
- ✅ 可以部署到生产环境

### 第8周目标
- ✅ iOS应用上线
- ✅ Android应用上线
- ✅ 代码复用率 > 70%
- ✅ 三端统一完成

---

## 📞 常见问题

**Q: 现有项目会受到影响吗？**
A: 不会。所有优化都是增量式的，现有功能不会受到影响。

**Q: 需要多少人力？**
A: 建议3-4人团队，可分工并行进行。

**Q: 可以立即开始吗？**
A: 可以。代码分割和图片优化今天就能做。

**Q: 如何验证优化效果？**
A: 使用Chrome DevTools和Lighthouse进行测试。

---

**开始日期：** 现在
**预计完成：** 8-10周
**预期收益：** 性能提升60%+，三端统一
