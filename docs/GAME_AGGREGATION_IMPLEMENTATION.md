# GameHub 游戏聚合实施进度

## ✅ 已完成的工作

### 1. 安全配置 ✅
- ✅ 创建 `.env` 文件（安全存储API密钥）
- ✅ 配置 `.gitignore` 保护敏感信息
- ✅ API密钥已安全配置：
  - RAWG API: `ca78aa8fd3a542068ee73764f5879631`
  - Itch.io API: `2nlnlpMzPERDH8JaXG4OQwK9Y1Wi0r2rIKZUN0vU`

### 2. 后端服务 ✅
- ✅ **GameAggregationService** (`packages/backend/src/services/gameAggregation.service.ts`)
  - `fetchRAWGGames()` - 获取RAWG游戏
  - `fetchItchGames()` - 获取Itch.io游戏
  - `fetchIGDBGames()` - 获取IGDB游戏
  - `aggregateAllGames()` - 聚合所有来源
  - `deduplicateGames()` - 去重
  - `filterGames()` - 过滤不适当游戏

- ✅ **SyncGamesTask** (`packages/backend/src/tasks/syncGames.task.ts`)
  - 每天凌晨2点自动同步
  - 支持手动触发
  - 完整的日志记录

- ✅ **GameAggregationController** (`packages/backend/src/controllers/gameAggregation.controller.ts`)
  - `GET /api/games` - 获取游戏列表
  - `GET /api/games/:id` - 获取游戏详情
  - `GET /api/games/search/:keyword` - 搜索游戏
  - `GET /api/games/source/:source` - 按来源获取
  - `POST /api/admin/sync-games` - 手动同步
  - `GET /api/games/stats/summary` - 获取统计信息

---

## 📋 下一步要做的工作

### Step 1: 扩展现有Game实体 (30分钟) ✅

**现有实体位置**：`packages/backend/src/modules/games/entities/game.entity.ts`

**已存在的字段**：
- ✅ title, description, coverImageUrl, gameUrl
- ✅ categoryTags, pointRewardRules
- ✅ availabilityStatus, isFeatured, playCount, averageRating
- ✅ 业务逻辑方法（calculatePoints, isPlayable等）

**已添加的字段**（用于游戏聚合）：
```typescript
// 游戏来源相关字段
@Column({ type: 'varchar', length: 50, name: 'source', nullable: true })
source: string | null; // 'rawg', 'itch', 'igdb', 'wechat', 'douyin'

@Column({ type: 'varchar', length: 100, name: 'source_id', nullable: true })
sourceId: string | null; // 原始平台的游戏ID

@Column({ type: 'varchar', length: 500, name: 'source_url', nullable: true })
sourceUrl: string | null; // 原始游戏的直接链接

// 游戏元数据
@Column({ type: 'jsonb', name: 'genres', default: [], nullable: true })
genres: string[] | null; // 游戏类型

@Column({ type: 'jsonb', name: 'platforms', default: [], nullable: true })
platforms: string[] | null; // 游戏平台

@Column({ type: 'varchar', length: 100, name: 'release_date', nullable: true })
releaseDate: string | null; // 发布日期

@Column({ type: 'decimal', precision: 5, scale: 2, name: 'rating', nullable: true })
rating: number | null; // 游戏评分
```

**修改说明**：
- 这些字段都设置为 `nullable: true`，以兼容现有的游戏
- 使用 `name` 属性指定数据库列名（snake_case）
- 利用现有的 SnakeCaseNamingStrategy 自动处理映射

### Step 2: 创建GameRepository (30分钟)

创建文件：`packages/backend/src/repositories/game.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Game } from '../entities/game.entity';

@Injectable()
export class GameRepository extends Repository<Game> {
  constructor(private dataSource: DataSource) {
    super(Game, dataSource.createEntityManager());
  }

  // 添加自定义查询方法
}
```

### Step 3: 创建Game模块 (30分钟)

创建文件：`packages/backend/src/modules/game/game.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from '../../entities/game.entity';
import { GameAggregationService } from '../../services/gameAggregation.service';
import { GameAggregationController } from '../../controllers/gameAggregation.controller';
import { SyncGamesTask } from '../../tasks/syncGames.task';

@Module({
  imports: [TypeOrmModule.forFeature([Game])],
  providers: [GameAggregationService, SyncGamesTask],
  controllers: [GameAggregationController],
  exports: [GameAggregationService],
})
export class GameModule {}
```

### Step 4: 在主模块中注册 (15分钟)

编辑文件：`packages/backend/src/app.module.ts`

```typescript
import { GameModule } from './modules/game/game.module';

@Module({
  imports: [
    // ... 其他模块
    GameModule,
  ],
})
export class AppModule {}
```

### Step 5: 创建前端组件 (2小时)

#### 5.1 创建GameCard组件

创建文件：`packages/frontend/src/components/GameCard.tsx`

```typescript
import { Card, Tag, Rate } from 'antd';
import { ExternalLinkOutlined } from '@ant-design/icons';

export function GameCard({ game }) {
  const handlePlay = () => {
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
          <Tag color="blue" style={{ position: 'absolute', top: 10, right: 10 }}>
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
          </div>
        }
      />
    </Card>
  );
}
```

#### 5.2 创建GameListPage页面

创建文件：`packages/frontend/src/pages/GameListPage.tsx`

```typescript
import { useEffect, useState } from 'react';
import { Select, Spin, Empty, Pagination, Row, Col } from 'antd';
import { GameCard } from '../components/GameCard';

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
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filters.source !== 'all' && { source: filters.source }),
        ...(filters.platform !== 'all' && { platform: filters.platform }),
      });

      const response = await fetch(`/api/games?${params}`);
      const data = await response.json();
      setGames(data.data);
      setTotal(data.pagination.total);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>🎮 游戏库 ({total})</h1>

      {/* 筛选器 */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <Select
          style={{ width: 200 }}
          value={filters.source}
          onChange={(value) => {
            setFilters({ ...filters, source: value });
            setPage(1);
          }}
          options={[
            { label: '所有来源', value: 'all' },
            { label: 'RAWG', value: 'rawg' },
            { label: 'Itch.io', value: 'itch' },
            { label: 'IGDB', value: 'igdb' },
          ]}
        />
      </div>

      {/* 游戏列表 */}
      <Spin spinning={loading}>
        {games.length > 0 ? (
          <>
            <Row gutter={[16, 16]}>
              {games.map(game => (
                <Col key={game.id} xs={24} sm={12} md={8} lg={6}>
                  <GameCard game={game} />
                </Col>
              ))}
            </Row>

            {/* 分页 */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
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

### Step 6: 测试API (1小时)

```bash
# 1. 启动后端
cd packages/backend
npm run start

# 2. 测试聚合服务
curl http://localhost:3000/api/games

# 3. 测试手动同步
curl -X POST http://localhost:3000/api/admin/sync-games

# 4. 测试统计信息
curl http://localhost:3000/api/games/stats/summary
```

### Step 7: 部署 (1小时)

```bash
# 1. 构建后端
npm run build

# 2. 构建前端
cd packages/frontend
npm run build

# 3. 部署到服务器
# 根据你的部署方式上传文件
```

---

## 📊 预期时间表

| 步骤 | 任务 | 预计时间 | 状态 |
|------|------|--------|------|
| 1 | 创建Game实体 | 1小时 | ⏳ |
| 2 | 创建GameRepository | 30分钟 | ⏳ |
| 3 | 创建Game模块 | 30分钟 | ⏳ |
| 4 | 注册主模块 | 15分钟 | ⏳ |
| 5 | 创建前端组件 | 2小时 | ⏳ |
| 6 | 测试API | 1小时 | ⏳ |
| 7 | 部署 | 1小时 | ⏳ |
| **总计** | | **6.5小时** | |

---

## 🎯 成功指标

- [ ] 所有API端点正常工作
- [ ] 能够成功聚合RAWG游戏
- [ ] 能够成功聚合Itch.io游戏
- [ ] 能够成功聚合IGDB游戏
- [ ] 前端能正确显示游戏列表
- [ ] 搜索功能正常
- [ ] 筛选功能正常
- [ ] 定时同步任务正常运行

---

## 🚀 立即开始

现在你可以继续执行Step 1，创建Game实体！

需要我帮你创建Game实体吗？
