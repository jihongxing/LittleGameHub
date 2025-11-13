# GameHub 三端统一实施指南

## 📖 目录
- [环境准备](#环境准备)
- [Monorepo搭建](#monorepo搭建)
- [共享层实现](#共享层实现)
- [移动端开发](#移动端开发)
- [性能优化实践](#性能优化实践)

---

## 🔧 环境准备

### 1. 开发环境要求

```bash
# 必需软件
- Node.js 18+
- pnpm 8+
- Git 2.30+

# iOS开发（仅Mac）
- Xcode 15+
- CocoaPods 1.12+
- iOS Simulator

# Android开发
- Android Studio
- JDK 11+
- Android SDK 33+
- Android Emulator
```

### 2. 安装依赖

```bash
# 安装pnpm
npm install -g pnpm

# 安装Turborepo
pnpm add -g turbo

# 安装React Native CLI
npm install -g react-native-cli

# iOS依赖（Mac）
sudo gem install cocoapods
```

---

## 🏗️ Monorepo搭建

### 1. 创建项目结构

```bash
# 创建根目录
mkdir gamehub && cd gamehub

# 初始化pnpm workspace
pnpm init

# 创建packages目录
mkdir -p packages/{core,mobile,web,backend}
```

### 2. 配置pnpm workspace

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

### 3. 配置Turborepo

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "outputs": [],
      "dependsOn": []
    }
  }
}
```

### 4. 根package.json配置

```json
{
  "name": "gamehub-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.45.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 📦 共享层实现

### 1. 创建Core包

```bash
cd packages/core
pnpm init
```

```json
// packages/core/package.json
{
  "name": "@gamehub/core",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest"
  },
  "dependencies": {
    "axios": "^1.4.0",
    "zustand": "^4.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 2. TypeScript配置

```json
// packages/core/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. API客户端实现

```typescript
// packages/core/src/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface APIClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class APIClient {
  private client: AxiosInstance;
  private tokenGetter?: () => Promise<string | null>;

  constructor(config: APIClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    this.setupInterceptors();
  }

  setTokenGetter(getter: () => Promise<string | null>) {
    this.tokenGetter = getter;
  }

  private setupInterceptors() {
    // 请求拦截器
    this.client.interceptors.request.use(
      async (config) => {
        if (this.tokenGetter) {
          const token = await this.tokenGetter();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        if (error.response?.status === 401) {
          // 触发token刷新逻辑
          // await this.refreshToken();
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config);
  }
}

// 创建单例
export const apiClient = new APIClient({
  baseURL: process.env.API_BASE_URL || 'https://api.gamehub.com',
});
```

### 4. 状态管理（Zustand）

```typescript
// packages/core/src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),

      setToken: (token) => set({ token }),

      login: async (credentials) => {
        try {
          const response = await authAPI.login(credentials);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
          });
        } catch (error) {
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      // 平台适配的存储
      storage: createJSONStorage(() => {
        // 运行时检测
        if (typeof window !== 'undefined') {
          return localStorage; // Web
        } else {
          // React Native需要单独配置
          return {
            getItem: async (name: string) => {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              return await AsyncStorage.getItem(name);
            },
            setItem: async (name: string, value: string) => {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.setItem(name, value);
            },
            removeItem: async (name: string) => {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.removeItem(name);
            },
          };
        }
      }),
    }
  )
);
```

### 5. 通用Hooks

```typescript
// packages/core/src/hooks/useGames.ts
import { useState, useEffect } from 'react';
import { gamesAPI } from '../api/games.api';
import type { Game } from '../models';

export function useGames(filters?: GameFilters) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchGames = async () => {
      try {
        setLoading(true);
        const data = await gamesAPI.getGames(filters);
        if (!cancelled) {
          setGames(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchGames();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  return { games, loading, error };
}
```

---

## 📱 移动端开发

### 1. 初始化React Native项目

```bash
# 创建RN项目
cd packages
npx react-native init mobile --template react-native-template-typescript

# 安装核心依赖
cd mobile
pnpm add @gamehub/core
pnpm add @react-navigation/native @react-navigation/native-stack
pnpm add react-native-screens react-native-safe-area-context
pnpm add zustand
pnpm add react-native-fast-image
```

### 2. 配置React Navigation

```typescript
// packages/mobile/src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@gamehub/core';

import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { GameDetailScreen } from '../screens/GameDetailScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="GameDetail" component={GameDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

### 3. 游戏列表组件（优化版）

```typescript
// packages/mobile/src/components/GameList.tsx
import React, { useCallback, memo } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Game } from '@gamehub/core';
import { GameCard } from './GameCard';

interface GameListProps {
  games: Game[];
  onGamePress: (game: Game) => void;
}

const ITEM_HEIGHT = 120;

export const GameList: React.FC<GameListProps> = memo(({ games, onGamePress }) => {
  const renderItem = useCallback(
    ({ item }: { item: Game }) => (
      <GameCard game={item} onPress={() => onGamePress(item)} />
    ),
    [onGamePress]
  );

  const keyExtractor = useCallback((item: Game) => item.id.toString(), []);

  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      data={games}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      
      // 性能优化配置
      maxToRenderPerBatch={10}
      initialNumToRender={10}
      windowSize={5}
      removeClippedSubviews={true}
      updateCellsBatchingPeriod={50}
      
      // 下拉刷新
      onRefresh={() => {}}
      refreshing={false}
      
      // 样式
      contentContainerStyle={styles.container}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
```

### 4. 游戏卡片组件

```typescript
// packages/mobile/src/components/GameCard.tsx
import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Game } from '@gamehub/core';

interface GameCardProps {
  game: Game;
  onPress: () => void;
}

export const GameCard: React.FC<GameCardProps> = memo(({ game, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <FastImage
        source={{
          uri: game.coverUrl,
          priority: FastImage.priority.normal,
          cache: FastImage.cacheControl.immutable,
        }}
        style={styles.cover}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {game.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {game.description}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.rating}>⭐ {game.rating}</Text>
          <Text style={styles.downloads}>🎮 {game.downloads}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cover: {
    width: 80,
    height: 96,
    borderRadius: 8,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rating: {
    fontSize: 12,
    color: '#888',
  },
  downloads: {
    fontSize: 12,
    color: '#888',
  },
});
```

---

## ⚡ 性能优化实践

### 1. 图片优化完整方案

```typescript
// packages/core/src/utils/imageOptimizer.ts
export class ImageOptimizer {
  // 根据设备像素比选择图片尺寸
  static getOptimalSize(width: number): number {
    const pixelRatio = typeof window !== 'undefined' 
      ? window.devicePixelRatio 
      : 2;
    
    const targetWidth = width * pixelRatio;
    
    // 选择最接近的CDN尺寸
    const sizes = [200, 400, 800, 1200];
    return sizes.find(size => size >= targetWidth) || 1200;
  }

  // 生成优化的图片URL
  static getOptimizedUrl(
    url: string,
    width: number,
    quality: number = 80
  ): string {
    const size = this.getOptimalSize(width);
    const format = this.getSupportedFormat();
    
    return `${url}?w=${size}&q=${quality}&format=${format}`;
  }

  // 检测支持的图片格式
  static getSupportedFormat(): 'webp' | 'jpeg' {
    if (typeof window === 'undefined') return 'jpeg';
    
    const canvas = document.createElement('canvas');
    const isWebPSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    
    return isWebPSupported ? 'webp' : 'jpeg';
  }
}
```

### 2. 请求防抖和节流

```typescript
// packages/core/src/utils/debounce.ts
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 使用示例
import { debounce } from '@gamehub/core';

const searchGames = debounce(async (keyword: string) => {
  const results = await gamesAPI.search(keyword);
  setSearchResults(results);
}, 300);
```

### 3. 内存泄漏防护

```typescript
// packages/core/src/hooks/useSafeAsync.ts
import { useEffect, useRef, useCallback } from 'react';

export function useSafeAsync() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeAsync = useCallback(
    <T,>(promise: Promise<T>): Promise<T> => {
      return new Promise((resolve, reject) => {
        promise
          .then((value) => {
            if (isMountedRef.current) {
              resolve(value);
            }
          })
          .catch((error) => {
            if (isMountedRef.current) {
              reject(error);
            }
          });
      });
    },
    []
  );

  return { safeAsync, isMounted: () => isMountedRef.current };
}

// 使用示例
function MyComponent() {
  const { safeAsync } = useSafeAsync();
  
  const fetchData = async () => {
    try {
      const data = await safeAsync(api.getData());
      // 只有在组件挂载时才会执行
      setData(data);
    } catch (error) {
      console.error(error);
    }
  };
  
  return <div>...</div>;
}
```

---

## 🧪 测试策略

### 1. 单元测试（Jest）

```typescript
// packages/core/src/api/__tests__/client.test.ts
import { APIClient } from '../client';

describe('APIClient', () => {
  let client: APIClient;

  beforeEach(() => {
    client = new APIClient({
      baseURL: 'https://api.test.com',
    });
  });

  it('should make GET request', async () => {
    const data = await client.get('/users');
    expect(data).toBeDefined();
  });

  it('should attach token to request', async () => {
    client.setTokenGetter(async () => 'test-token');
    const data = await client.get('/protected');
    expect(data).toBeDefined();
  });
});
```

### 2. E2E测试（Detox）

```javascript
// packages/mobile/e2e/gameList.test.js
describe('Game List', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should display game list', async () => {
    await expect(element(by.id('game-list'))).toBeVisible();
  });

  it('should navigate to game detail', async () => {
    await element(by.id('game-card-1')).tap();
    await expect(element(by.id('game-detail'))).toBeVisible();
  });
});
```

---

## 📊 性能监控

```typescript
// packages/core/src/monitoring/performance.ts
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static mark(name: string) {
    if (typeof performance !== 'undefined') {
      performance.mark(name);
    }
  }

  static measure(name: string, startMark: string, endMark: string) {
    if (typeof performance !== 'undefined') {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      
      this.recordMetric(name, measure.duration);
      
      // 上报慢操作
      if (measure.duration > 3000) {
        this.reportSlowOperation(name, measure.duration);
      }
    }
  }

  private static recordMetric(name: string, duration: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
  }

  static getMetrics(name: string) {
    const durations = this.metrics.get(name) || [];
    if (durations.length === 0) return null;

    const avg = durations.reduce((a, b) => a + b) / durations.length;
    const max = Math.max(...durations);
    const min = Math.min(...durations);

    return { avg, max, min, count: durations.length };
  }

  private static reportSlowOperation(name: string, duration: number) {
    console.warn(`Slow operation detected: ${name} took ${duration}ms`);
    // 上报到监控系统
  }
}

// 使用示例
PerformanceMonitor.mark('api-start');
const data = await api.getData();
PerformanceMonitor.mark('api-end');
PerformanceMonitor.measure('api-call', 'api-start', 'api-end');
```

---

## 🚀 部署流程

### 1. Web端部署

```bash
# 构建生产版本
cd packages/web
pnpm run build

# 部署到CDN
aws s3 sync dist/ s3://gamehub-web --delete
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

### 2. 移动端发布

```bash
# iOS发布
cd packages/mobile/ios
fastlane release

# Android发布
cd packages/mobile/android
./gradlew bundleRelease

# 热更新发布
appcenter codepush release-react -a YourOrg/GameHub -d Production
```

---

**文档更新：** 2024-11-13
