# GameHub 安全游戏存储实施指南

## 🎯 核心原则

**只存储游戏的链接和元数据，不存储游戏文件本身。**

---

## 📊 三种存储方案详细对比

### 方案1：纯链接聚合（推荐 ⭐⭐⭐⭐⭐）

**存储内容**：
```
✅ 游戏标题
✅ 游戏描述
✅ 游戏封面URL（原始链接）
✅ 游戏评分
✅ 游戏分类
✅ 原始游戏链接
✅ 原始平台ID
❌ 游戏文件
❌ 游戏代码
```

**数据库大小**：
- 100,000款游戏 ≈ 50-100 MB
- 1,000,000款游戏 ≈ 500-1000 MB

**成本**：
- 存储成本：几乎为0
- 带宽成本：几乎为0
- 服务器成本：最小

**实现代码**：

```typescript
// backend/src/entities/game.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ========== 元数据（可以存储）==========
  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('float', { default: 0 })
  rating: number;

  @Column('simple-array', { nullable: true })
  genres: string[];

  @Column('simple-array', { nullable: true })
  platforms: string[];

  @Column({ nullable: true })
  releaseDate: string;

  // ========== 关键：原始链接信息 ==========
  @Column()
  source: string; // 'rawg', 'itch', 'igdb', 'wechat', 'douyin'

  @Column()
  sourceId: string; // 原始平台的游戏ID

  @Column()
  sourceUrl: string; // 原始游戏的完整URL

  // ========== 媒体文件（使用原始URL，不下载） ==========
  @Column({ nullable: true })
  coverUrl: string; // 原始封面URL

  @Column('simple-array', { nullable: true })
  screenshotUrls: string[]; // 原始截图URL

  // ========== 统计信息 ==========
  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  playCount: number;

  @Column({ default: 0 })
  favoriteCount: number;

  // ========== 元数据 ==========
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: true })
  isActive: boolean;

  // ========== 不存储的字段 ==========
  // ❌ 游戏文件
  // ❌ 游戏代码
  // ❌ 游戏资源
  // ❌ 游戏数据
}
```

**前端实现**：

```typescript
// frontend/src/components/GameCard.tsx
import { Card, Button, Tag, Rate } from 'antd';
import { ExternalLinkOutlined } from '@ant-design/icons';

interface GameCardProps {
  game: {
    id: string;
    title: string;
    description: string;
    coverUrl: string;
    rating: number;
    genres: string[];
    source: string;
    sourceUrl: string;
  };
}

export function GameCard({ game }: GameCardProps) {
  const handlePlay = () => {
    // 直接跳转到原始平台
    window.open(game.sourceUrl, '_blank');
  };

  return (
    <Card
      hoverable
      cover={
        <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
          <img
            src={game.coverUrl}
            alt={game.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* 来源标签 */}
          <Tag
            color="blue"
            style={{ position: 'absolute', top: 10, right: 10 }}
          >
            {game.source.toUpperCase()}
          </Tag>
        </div>
      }
      onClick={handlePlay}
      style={{ cursor: 'pointer' }}
    >
      <Card.Meta
        title={game.title}
        description={
          <div>
            <p>{game.description?.substring(0, 100)}...</p>
            <div style={{ marginTop: 10 }}>
              <Rate value={game.rating / 2} disabled />
              <span style={{ marginLeft: 10 }}>({game.rating})</span>
            </div>
            <div style={{ marginTop: 10 }}>
              {game.genres?.map(genre => (
                <Tag key={genre} color="cyan">
                  {genre}
                </Tag>
              ))}
            </div>
          </div>
        }
      />
      <Button
        type="primary"
        block
        style={{ marginTop: 10 }}
        onClick={handlePlay}
        icon={<ExternalLinkOutlined />}
      >
        前往游戏
      </Button>
    </Card>
  );
}
```

---

### 方案2：智能缓存聚合（中等风险 ⭐⭐⭐）

**何时使用**：
- 第三方API响应慢
- 需要离线搜索
- 需要快速加载

**实现代码**：

```typescript
// backend/src/services/gameCache.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Game } from '../entities/game.entity';
import { GameAggregationService } from './gameAggregation.service';

@Injectable()
export class GameCacheService {
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时

  constructor(
    private gameRepository: Repository<Game>,
    private aggregationService: GameAggregationService,
  ) {}

  /**
   * 获取游戏（优先使用缓存）
   */
  async getGame(source: string, sourceId: string): Promise<Game | null> {
    // 1. 尝试从缓存获取
    let game = await this.gameRepository.findOne({
      where: { source, sourceId },
    });

    // 2. 如果缓存不存在或过期，从API获取
    if (!game || this.isExpired(game.updatedAt)) {
      const freshData = await this.aggregationService.fetchGameDetails(
        source,
        sourceId,
      );

      if (freshData) {
        game = game || new Game();
        Object.assign(game, freshData);
        await this.gameRepository.save(game);
      }
    }

    return game;
  }

  /**
   * 批量缓存游戏
   */
  async cacheGames(games: any[], source: string): Promise<Game[]> {
    const cachedGames: Game[] = [];

    for (const gameData of games) {
      let game = await this.gameRepository.findOne({
        where: { source, sourceId: gameData.id },
      });

      if (!game) {
        game = new Game();
      }

      // 更新元数据
      game.source = source;
      game.sourceId = gameData.id;
      game.title = gameData.name || gameData.title;
      game.description = gameData.description || gameData.summary || '';
      game.rating = gameData.rating || 0;
      game.genres = gameData.genres || [];
      game.platforms = gameData.platforms || [];
      game.releaseDate = gameData.released || gameData.first_release_date || '';

      // 关键：保存原始链接
      game.sourceUrl = this.buildSourceUrl(source, gameData.id);
      game.coverUrl = gameData.background_image || gameData.cover?.url || '';

      await this.gameRepository.save(game);
      cachedGames.push(game);
    }

    return cachedGames;
  }

  /**
   * 检查缓存是否过期
   */
  private isExpired(updatedAt: Date): boolean {
    return Date.now() - updatedAt.getTime() > this.CACHE_DURATION;
  }

  /**
   * 构建原始游戏链接
   */
  private buildSourceUrl(source: string, id: string | number): string {
    const urls: Record<string, string> = {
      rawg: `https://rawg.io/games/${id}`,
      itch: `https://itch.io/games/${id}`,
      igdb: `https://www.igdb.com/games/${id}`,
      wechat: `https://minigame.qq.com/game/${id}`,
      douyin: `https://www.douyin.com/game/${id}`,
    };
    return urls[source] || '';
  }

  /**
   * 清理过期缓存
   */
  async cleanupExpiredCache(): Promise<number> {
    const expiredDate = new Date(Date.now() - this.CACHE_DURATION);

    const result = await this.gameRepository
      .createQueryBuilder()
      .delete()
      .where('updatedAt < :expiredDate', { expiredDate })
      .execute();

    return result.affected || 0;
  }
}
```

**定时清理任务**：

```typescript
// backend/src/tasks/cacheCleanup.task.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GameCacheService } from '../services/gameCache.service';

@Injectable()
export class CacheCleanupTask {
  constructor(private gameCacheService: GameCacheService) {}

  /**
   * 每天凌晨3点清理过期缓存
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredCache() {
    console.log('🧹 开始清理过期缓存...');
    const deletedCount = await this.gameCacheService.cleanupExpiredCache();
    console.log(`✅ 清理了 ${deletedCount} 条过期记录`);
  }
}
```

---

### 方案3：CDN加速（可选 ⭐⭐⭐⭐）

**何时使用**：
- 原始封面加载慢
- 需要快速访问
- 用户分布广泛

**实现代码**：

```typescript
// backend/src/services/imageCDN.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class ImageCDNService {
  /**
   * 使用CDN加速原始图片
   * 不下载图片，只是通过CDN代理
   */
  getCDNUrl(originalUrl: string): string {
    if (!originalUrl) return '';

    // 方案1：使用Cloudflare Image Optimization
    return `https://cdn.example.com/image?url=${encodeURIComponent(originalUrl)}`;

    // 方案2：使用imgproxy
    // return `https://imgproxy.example.com/unsafe/300x300/smart/${encodeURIComponent(originalUrl)}`;

    // 方案3：使用阿里云CDN
    // return `https://cdn.aliyun.com/?url=${encodeURIComponent(originalUrl)}`;
  }

  /**
   * 获取缩略图
   */
  getThumbnailUrl(originalUrl: string, width = 300, height = 300): string {
    if (!originalUrl) return '';

    // 使用imgproxy生成缩略图
    return `https://imgproxy.example.com/unsafe/${width}x${height}/smart/${encodeURIComponent(originalUrl)}`;
  }
}
```

---

## 🔒 安全检查清单

### 数据库设计检查

```typescript
// ✅ 正确的做法
const game = {
  id: 'uuid',
  title: '游戏名称',
  description: '游戏描述',
  rating: 4.5,
  source: 'rawg',
  sourceId: '123',
  sourceUrl: 'https://rawg.io/games/123', // ✅ 原始链接
  coverUrl: 'https://media.rawg.io/...',  // ✅ 原始URL
  createdAt: new Date(),
};

// ❌ 错误的做法
const badGame = {
  id: 'uuid',
  title: '游戏名称',
  gameFile: '/games/game.zip',           // ❌ 游戏文件
  gameCode: 'function play() {...}',     // ❌ 游戏代码
  gameData: { ... },                     // ❌ 游戏数据
  owner: 'MyCompany',                    // ❌ 声称拥有
};
```

### API端点检查

```typescript
// ✅ 正确的做法
@Get('/games/:id')
async getGame(@Param('id') id: string) {
  const game = await this.gameRepository.findOne(id);
  return {
    ...game,
    // 返回原始链接
    playUrl: game.sourceUrl,
  };
}

// ❌ 错误的做法
@Get('/games/:id/download')
async downloadGame(@Param('id') id: string) {
  // ❌ 不要提供游戏下载
  return downloadGameFile(id);
}

@Get('/games/:id/play')
async playGame(@Param('id') id: string) {
  // ❌ 不要在自己的服务器上运行游戏
  return runGameLocally(id);
}
```

### 前端检查

```typescript
// ✅ 正确的做法
function GameCard({ game }) {
  return (
    <div>
      <h3>{game.title}</h3>
      <p>来源: {game.source}</p>
      <a href={game.sourceUrl} target="_blank">
        🎮 前往游戏
      </a>
    </div>
  );
}

// ❌ 错误的做法
function BadGameCard({ game }) {
  return (
    <div>
      <h3>{game.title}</h3>
      <p>来自: 我们的平台</p>
      {/* ❌ 不要嵌入游戏 */}
      <iframe src={game.gameFile} />
    </div>
  );
}
```

---

## 📋 存储成本对比

### 方案1：纯链接聚合

```
存储需求：
- 100,000款游戏 × 1KB = 100MB
- 1,000,000款游戏 × 1KB = 1GB

成本估算（AWS S3）：
- 存储成本：$0.023/GB/月 = $0.023/月
- 数据传输：几乎为0
- 总成本：< $1/月

✅ 最经济
```

### 方案2：元数据缓存

```
存储需求：
- 100,000款游戏 × 5KB = 500MB
- 1,000,000款游戏 × 5KB = 5GB

成本估算（AWS S3）：
- 存储成本：$0.023/GB/月 = $0.115/月
- 数据传输：$0.09/GB
- 总成本：$1-10/月

⚠️ 中等成本
```

### 方案3：文件存储（不推荐）

```
存储需求：
- 100,000款游戏 × 50MB = 5TB
- 1,000,000款游戏 × 50MB = 50TB

成本估算（AWS S3）：
- 存储成本：$0.023/GB/月 = $115,000/月
- 数据传输：$0.09/GB = $450,000/月
- 总成本：$565,000+/月

❌ 极其昂贵
```

---

## 🎯 推荐实施方案

### 第1阶段：快速启动（第1周）

```typescript
// 1. 创建简单的Game实体
@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('float')
  rating: number;

  @Column()
  source: string;

  @Column()
  sourceId: string;

  @Column()
  sourceUrl: string; // 关键

  @Column()
  coverUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}

// 2. 创建简单的API
@Get('/games')
async getGames() {
  return this.gameRepository.find({
    take: 100,
    order: { rating: 'DESC' },
  });
}

// 3. 前端跳转到原始链接
function playGame(game) {
  window.open(game.sourceUrl, '_blank');
}
```

### 第2阶段：优化（第2-3周）

```typescript
// 1. 添加缓存服务
class GameCacheService {
  async getGame(source, sourceId) {
    // 优先使用缓存
    // 过期时自动更新
  }
}

// 2. 添加CDN加速
class ImageCDNService {
  getCDNUrl(originalUrl) {
    // 通过CDN代理图片
  }
}

// 3. 添加定时清理
@Cron('0 3 * * *')
async cleanupExpiredCache() {
  // 清理过期数据
}
```

### 第3阶段：完善（第4周+）

```typescript
// 1. 添加搜索功能
// 2. 添加推荐算法
// 3. 添加用户评分
// 4. 添加分享功能
```

---

## ✅ 最终检查清单

在上线前，确保：

- [ ] 所有游戏都有原始链接（sourceUrl）
- [ ] 所有游戏都注明了来源（source）
- [ ] 没有下载任何游戏文件
- [ ] 没有修改任何游戏内容
- [ ] 没有声称拥有任何游戏
- [ ] 前端正确跳转到原始平台
- [ ] 有隐私政策
- [ ] 有使用条款
- [ ] 有投诉处理机制
- [ ] 定期检查链接有效性
- [ ] 定期更新游戏信息

---

## 🎁 总结

| 方案 | 存储 | 成本 | 风险 | 推荐 |
|------|------|------|------|------|
| **纯链接** | ✅ | $1/月 | 低 | ⭐⭐⭐⭐⭐ |
| **元数据缓存** | ⚠️ | $10/月 | 中 | ⭐⭐⭐ |
| **文件存储** | ❌ | $500K/月 | 高 | ❌ |

**最终建议**：采用**纯链接聚合模式**，这是最安全、最合法、最经济的方案！

---

**记住**：你的平台是一个聚合器，不是存储库。让用户在原始平台上玩游戏，你只需要提供最好的发现体验！ 🎮
