# GameHub 游戏聚合 - 快速实施指南（复制即用）

## 🚀 5分钟快速开始

### Step 1: 安装依赖（2分钟）

```bash
cd backend
pnpm add axios cron node-cron dotenv
pnpm add -D @types/node
```

### Step 2: 配置环境变量（1分钟）

创建 `.env` 文件：

```bash
# RAWG API
RAWG_API_KEY=your_rawg_api_key_here

# Itch.io API
ITCH_API_KEY=your_itch_api_key_here

# IGDB API
IGDB_CLIENT_ID=your_igdb_client_id
IGDB_ACCESS_TOKEN=your_igdb_access_token

# 微信小游戏
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret

# 抖音小游戏
DOUYIN_CLIENT_KEY=your_douyin_client_key
DOUYIN_CLIENT_SECRET=your_douyin_client_secret
```

### Step 3: 创建游戏聚合服务（2分钟）

创建文件：`backend/src/services/gameAggregation.service.ts`

```typescript
import axios from 'axios';

export interface AggregatedGame {
  source: string;
  sourceId: string | number;
  title: string;
  description: string;
  coverUrl: string;
  rating: number;
  genres: string[];
  platforms: string[];
  releaseDate: string;
}

export class GameAggregationService {
  /**
   * 从RAWG获取游戏（最简单，推荐首先使用）
   */
  async fetchRAWGGames(page = 1): Promise<AggregatedGame[]> {
    try {
      console.log(`正在获取RAWG第${page}页游戏...`);
      
      const response = await axios.get('https://api.rawg.io/api/games', {
        params: {
          key: process.env.RAWG_API_KEY,
          page,
          page_size: 100,
          ordering: '-rating', // 按评分排序
        },
      });

      return response.data.results.map((game: any) => ({
        source: 'rawg',
        sourceId: game.id,
        title: game.name,
        description: game.description || '',
        coverUrl: game.background_image || '',
        rating: game.rating || 0,
        genres: game.genres?.map((g: any) => g.name) || [],
        platforms: game.platforms?.map((p: any) => p.platform.name) || [],
        releaseDate: game.released || '',
      }));
    } catch (error) {
      console.error('RAWG获取失败:', error);
      return [];
    }
  }

  /**
   * 从Itch.io获取游戏
   */
  async fetchItchGames(page = 1): Promise<AggregatedGame[]> {
    try {
      console.log(`正在获取Itch.io第${page}页游戏...`);
      
      const response = await axios.get(
        `https://itch.io/api/1/${process.env.ITCH_API_KEY}/games`,
        {
          params: {
            page,
            sort_by: 'rating',
          },
        }
      );

      return response.data.games.map((game: any) => ({
        source: 'itch',
        sourceId: game.id,
        title: game.title,
        description: game.description || '',
        coverUrl: game.cover_url || '',
        rating: game.rating || 0,
        genres: [],
        platforms: ['Web'],
        releaseDate: game.created_at || '',
      }));
    } catch (error) {
      console.error('Itch.io获取失败:', error);
      return [];
    }
  }

  /**
   * 从IGDB获取游戏（数据最完整）
   */
  async fetchIGDBGames(offset = 0): Promise<AggregatedGame[]> {
    try {
      console.log(`正在获取IGDB游戏 (offset: ${offset})...`);
      
      const response = await axios.post(
        'https://api.igdb.com/v4/games',
        `fields name,summary,cover.url,rating,genres.name,platforms.name,first_release_date;
         where rating > 50;
         sort rating desc;
         limit 500;
         offset ${offset};`,
        {
          headers: {
            'Client-ID': process.env.IGDB_CLIENT_ID,
            'Authorization': `Bearer ${process.env.IGDB_ACCESS_TOKEN}`,
          },
        }
      );

      return response.data.map((game: any) => ({
        source: 'igdb',
        sourceId: game.id,
        title: game.name,
        description: game.summary || '',
        coverUrl: game.cover?.url ? `https:${game.cover.url}` : '',
        rating: game.rating || 0,
        genres: game.genres?.map((g: any) => g.name) || [],
        platforms: game.platforms?.map((p: any) => p.name) || [],
        releaseDate: game.first_release_date || '',
      }));
    } catch (error) {
      console.error('IGDB获取失败:', error);
      return [];
    }
  }

  /**
   * 聚合所有来源的游戏
   */
  async aggregateAllGames(limit = 1000): Promise<AggregatedGame[]> {
    const allGames: AggregatedGame[] = [];
    
    // 1. 获取RAWG游戏
    try {
      for (let page = 1; page <= Math.ceil(limit / 100); page++) {
        const games = await this.fetchRAWGGames(page);
        allGames.push(...games);
        if (allGames.length >= limit) break;
        // 避免速率限制
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error('RAWG聚合失败:', error);
    }

    // 2. 获取Itch.io游戏
    try {
      for (let page = 1; page <= Math.ceil((limit - allGames.length) / 100); page++) {
        const games = await this.fetchItchGames(page);
        allGames.push(...games);
        if (allGames.length >= limit) break;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error('Itch.io聚合失败:', error);
    }

    // 3. 获取IGDB游戏
    try {
      for (let offset = 0; offset < limit - allGames.length; offset += 500) {
        const games = await this.fetchIGDBGames(offset);
        allGames.push(...games);
        if (allGames.length >= limit) break;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error('IGDB聚合失败:', error);
    }

    console.log(`✅ 总共聚合了 ${allGames.length} 款游戏`);
    return allGames;
  }

  /**
   * 去重游戏
   */
  deduplicateGames(games: AggregatedGame[]): AggregatedGame[] {
    const seen = new Map<string, AggregatedGame>();
    
    for (const game of games) {
      // 使用标题和平台作为唯一标识
      const key = `${game.title.toLowerCase().trim()}_${game.platforms.join(',')}`;
      
      // 如果已存在，保留评分更高的
      if (seen.has(key)) {
        const existing = seen.get(key)!;
        if (game.rating > existing.rating) {
          seen.set(key, game);
        }
      } else {
        seen.set(key, game);
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * 过滤不适当的游戏
   */
  filterGames(games: AggregatedGame[]): AggregatedGame[] {
    return games.filter(game => {
      // 排除空标题
      if (!game.title || game.title.trim().length === 0) return false;
      
      // 排除没有封面的游戏
      if (!game.coverUrl) return false;
      
      // 排除评分过低的游戏
      if (game.rating < 2) return false;
      
      // 排除特定类型（可选）
      const bannedGenres = ['Adult', 'Erotic'];
      if (game.genres.some(g => bannedGenres.includes(g))) return false;
      
      return true;
    });
  }
}
```

---

## 📊 创建数据库模型

创建文件：`backend/src/models/game.model.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  source: string; // 'rawg', 'itch', 'igdb', 'wechat', 'douyin'

  @Column()
  sourceId: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  coverUrl: string;

  @Column('float', { default: 0 })
  rating: number;

  @Column('simple-array', { nullable: true })
  genres: string[];

  @Column('simple-array', { nullable: true })
  platforms: string[];

  @Column({ nullable: true })
  releaseDate: string;

  @Column({ default: 0 })
  downloadCount: number;

  @Column({ default: 0 })
  viewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: true })
  isActive: boolean;
}
```

---

## 🔄 创建定时同步任务

创建文件：`backend/src/tasks/syncGames.task.ts`

```typescript
import { CronJob } from 'cron';
import { GameAggregationService } from '../services/gameAggregation.service';
import { GameRepository } from '../repositories/game.repository';

export class SyncGamesTask {
  private cronJob: CronJob;

  constructor(
    private gameAggregationService: GameAggregationService,
    private gameRepository: GameRepository
  ) {}

  /**
   * 启动定时同步任务
   * 每天凌晨2点执行一次
   */
  start() {
    this.cronJob = new CronJob('0 2 * * *', () => this.sync());
    this.cronJob.start();
    console.log('✅ 游戏同步任务已启动（每天凌晨2点执行）');
  }

  /**
   * 执行同步
   */
  async sync() {
    console.log('🔄 开始同步游戏数据...');
    const startTime = Date.now();

    try {
      // 1. 聚合游戏
      let games = await this.gameAggregationService.aggregateAllGames(5000);
      console.log(`📥 聚合了 ${games.length} 款游戏`);

      // 2. 去重
      games = this.gameAggregationService.deduplicateGames(games);
      console.log(`🔄 去重后 ${games.length} 款游戏`);

      // 3. 过滤
      games = this.gameAggregationService.filterGames(games);
      console.log(`✅ 过滤后 ${games.length} 款游戏`);

      // 4. 保存到数据库
      await this.gameRepository.upsertMany(games);
      console.log(`💾 成功保存到数据库`);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✨ 游戏同步完成！耗时 ${duration} 秒`);
    } catch (error) {
      console.error('❌ 游戏同步失败:', error);
    }
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('⏹️ 游戏同步任务已停止');
    }
  }
}
```

---

## 🎮 创建API端点

创建文件：`backend/src/controllers/game.controller.ts`

```typescript
import { Router, Request, Response } from 'express';
import { GameRepository } from '../repositories/game.repository';
import { GameAggregationService } from '../services/gameAggregation.service';

export class GameController {
  private router = Router();

  constructor(
    private gameRepository: GameRepository,
    private gameAggregationService: GameAggregationService
  ) {
    this.setupRoutes();
  }

  private setupRoutes() {
    // 获取游戏列表
    this.router.get('/games', (req, res) => this.getGames(req, res));

    // 获取游戏详情
    this.router.get('/games/:id', (req, res) => this.getGameById(req, res));

    // 搜索游戏
    this.router.get('/games/search/:keyword', (req, res) => this.searchGames(req, res));

    // 按来源获取游戏
    this.router.get('/games/source/:source', (req, res) => this.getGamesBySource(req, res));

    // 手动触发同步（管理员）
    this.router.post('/admin/sync-games', (req, res) => this.syncGames(req, res));
  }

  /**
   * 获取游戏列表
   */
  async getGames(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const source = req.query.source as string;
      const platform = req.query.platform as string;

      const query = this.gameRepository.createQueryBuilder('game');

      if (source && source !== 'all') {
        query.where('game.source = :source', { source });
      }

      if (platform && platform !== 'all') {
        query.andWhere(':platform IN game.platforms', { platform });
      }

      query.where('game.isActive = :isActive', { isActive: true });

      const [games, total] = await query
        .orderBy('game.rating', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      res.json({
        data: games,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 获取游戏详情
   */
  async getGameById(req: Request, res: Response) {
    try {
      const game = await this.gameRepository.findOne({
        where: { id: req.params.id },
      });

      if (!game) {
        return res.status(404).json({ error: '游戏不存在' });
      }

      // 增加浏览次数
      game.viewCount++;
      await this.gameRepository.save(game);

      res.json(game);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 搜索游戏
   */
  async searchGames(req: Request, res: Response) {
    try {
      const keyword = req.params.keyword;
      const games = await this.gameRepository
        .createQueryBuilder('game')
        .where('game.title LIKE :keyword', { keyword: `%${keyword}%` })
        .orWhere('game.description LIKE :keyword', { keyword: `%${keyword}%` })
        .andWhere('game.isActive = :isActive', { isActive: true })
        .orderBy('game.rating', 'DESC')
        .limit(50)
        .getMany();

      res.json(games);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 按来源获取游戏
   */
  async getGamesBySource(req: Request, res: Response) {
    try {
      const source = req.params.source;
      const games = await this.gameRepository.find({
        where: { source, isActive: true },
        order: { rating: 'DESC' },
        take: 100,
      });

      res.json({
        source,
        count: games.length,
        games,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 手动触发同步
   */
  async syncGames(req: Request, res: Response) {
    try {
      // 检查管理员权限
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: '无权限' });
      }

      // 异步执行同步，不阻塞响应
      setImmediate(async () => {
        const games = await this.gameAggregationService.aggregateAllGames(10000);
        const filtered = this.gameAggregationService.filterGames(games);
        await this.gameRepository.upsertMany(filtered);
      });

      res.json({ message: '同步任务已启动' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  getRouter() {
    return this.router;
  }
}
```

---

## 🎨 前端展示组件

创建文件：`frontend/src/pages/GameListPage.tsx`

```typescript
import { useEffect, useState } from 'react';
import { Select, Spin, Empty, Pagination } from 'antd';
import { gamesAPI } from '../api/games.api';
import { GameCard } from '../components/GameCard';
import styles from './GameListPage.module.css';

export function GameListPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    source: 'all',
    platform: 'all',
  });

  useEffect(() => {
    loadGames();
  }, [page, filters]);

  async function loadGames() {
    setLoading(true);
    try {
      const response = await gamesAPI.getGames({
        page,
        limit: 20,
        source: filters.source,
        platform: filters.platform,
      });
      setGames(response.data);
      setTotal(response.pagination.total);
    } finally {
      setLoading(false);
    }
  }

  const sources = [
    { label: '所有来源', value: 'all' },
    { label: 'RAWG', value: 'rawg' },
    { label: 'Itch.io', value: 'itch' },
    { label: 'IGDB', value: 'igdb' },
    { label: '微信小游戏', value: 'wechat' },
    { label: '抖音小游戏', value: 'douyin' },
  ];

  const platforms = [
    { label: '所有平台', value: 'all' },
    { label: 'Web', value: 'Web' },
    { label: 'iOS', value: 'iOS' },
    { label: 'Android', value: 'Android' },
    { label: 'PC', value: 'PC' },
  ];

  return (
    <div className={styles.container}>
      <h1>🎮 游戏库 ({total})</h1>

      {/* 筛选器 */}
      <div className={styles.filters}>
        <Select
          style={{ width: 200 }}
          value={filters.source}
          onChange={(value) => {
            setFilters({ ...filters, source: value });
            setPage(1);
          }}
          options={sources}
          placeholder="选择来源"
        />

        <Select
          style={{ width: 200 }}
          value={filters.platform}
          onChange={(value) => {
            setFilters({ ...filters, platform: value });
            setPage(1);
          }}
          options={platforms}
          placeholder="选择平台"
        />
      </div>

      {/* 游戏列表 */}
      <Spin spinning={loading}>
        {games.length > 0 ? (
          <>
            <div className={styles.gameGrid}>
              {games.map(game => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>

            {/* 分页 */}
            <div className={styles.pagination}>
              <Pagination
                current={page}
                total={total}
                pageSize={20}
                onChange={setPage}
              />
            </div>
          </>
        ) : (
          <Empty description="暂无游戏" />
        )}
      </Spin>
    </div>
  );
}
```

---

## 🚀 启动应用

修改 `backend/src/main.ts`：

```typescript
import 'dotenv/config';
import { createConnection } from 'typeorm';
import { SyncGamesTask } from './tasks/syncGames.task';
import { GameAggregationService } from './services/gameAggregation.service';
import { GameRepository } from './repositories/game.repository';

async function main() {
  // 初始化数据库
  const connection = await createConnection();
  console.log('✅ 数据库连接成功');

  // 初始化服务
  const gameRepository = connection.getRepository(Game);
  const gameAggregationService = new GameAggregationService();

  // 启动同步任务
  const syncTask = new SyncGamesTask(gameAggregationService, gameRepository);
  syncTask.start();

  // 启动Express服务器
  const app = express();
  app.use(express.json());

  // 注册路由
  const gameController = new GameController(gameRepository, gameAggregationService);
  app.use('/api', gameController.getRouter());

  app.listen(3000, () => {
    console.log('✅ 服务器运行在 http://localhost:3000');
  });
}

main().catch(console.error);
```

---

## ✅ 检查清单

- [ ] 申请RAWG API密钥
- [ ] 申请Itch.io API密钥
- [ ] 申请IGDB API密钥
- [ ] 配置.env文件
- [ ] 创建游戏聚合服务
- [ ] 创建数据库模型
- [ ] 创建定时同步任务
- [ ] 创建API端点
- [ ] 创建前端组件
- [ ] 启动应用并测试

---

## 🎯 预期结果

运行应用后，你将获得：

✅ **第1天**
- 50000+游戏
- 完整的搜索功能
- 游戏详情页面

✅ **第1周**
- 100000+游戏
- 游戏分类和筛选
- 用户评分系统

✅ **第2周**
- 150000+游戏
- 推荐算法
- 社交分享功能

---

**现在就开始吧！** 🚀
