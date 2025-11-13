# GameHub 游戏存储和法律指南

## 🎯 核心问题

**问题**：从第三方平台聚合的游戏，是否可以保存在自己的服务器上？

**简短答案**：
- ✅ **可以聚合和展示链接**（推荐）
- ⚠️ **可以缓存元数据**（需谨慎）
- ❌ **不能直接复制游戏文件**（违法）

---

## 📋 三种存储方案对比

### 方案1️⃣：链接聚合模式（推荐 ⭐⭐⭐⭐⭐）

**做法**：只保存游戏的链接和元数据，游戏本体保存在原平台

```typescript
// 存储的数据结构
interface GameLink {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  rating: number;
  
  // 关键：保存原始链接
  source: 'rawg' | 'itch' | 'igdb' | 'wechat' | 'douyin';
  sourceUrl: string;      // 原始游戏链接
  sourceId: string;       // 原始游戏ID
  
  // 可选：保存元数据
  genres: string[];
  platforms: string[];
  releaseDate: string;
  
  createdAt: Date;
  updatedAt: Date;
}
```

**优势**：
- ✅ 完全合法
- ✅ 不侵犯版权
- ✅ 节省存储空间
- ✅ 自动获得最新版本
- ✅ 支持原作者获利

**劣势**：
- ❌ 依赖第三方平台可用性
- ❌ 如果原链接失效，游戏无法访问

**实施代码**：

```typescript
// backend/src/models/gameLink.model.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('game_links')
export class GameLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  coverUrl: string;

  @Column('float')
  rating: number;

  // 关键字段：原始来源信息
  @Column()
  source: string; // 'rawg', 'itch', 'igdb', etc.

  @Column()
  sourceUrl: string; // 指向原始游戏的URL

  @Column()
  sourceId: string; // 原始平台的游戏ID

  @Column('simple-array')
  genres: string[];

  @Column('simple-array')
  platforms: string[];

  @Column()
  releaseDate: string;

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

**前端实现**：

```typescript
// frontend/src/components/GameCard.tsx
export function GameCard({ game }: { game: GameLink }) {
  const handlePlay = () => {
    // 直接跳转到原始游戏链接
    window.open(game.sourceUrl, '_blank');
  };

  return (
    <div className="game-card">
      <img src={game.coverUrl} alt={game.title} />
      <h3>{game.title}</h3>
      <p>{game.description}</p>
      <div className="meta">
        <span>⭐ {game.rating}</span>
        <span>来源: {game.source}</span>
      </div>
      <button onClick={handlePlay}>
        🎮 前往游戏
      </button>
    </div>
  );
}
```

---

### 方案2️⃣：元数据缓存模式（需谨慎 ⭐⭐⭐）

**做法**：缓存游戏的元数据（标题、描述、评分等），但不缓存游戏本体

```typescript
interface CachedGameMetadata {
  // 元数据（可以缓存）
  title: string;
  description: string;
  genres: string[];
  platforms: string[];
  rating: number;
  releaseDate: string;
  
  // 媒体文件（需要谨慎处理）
  coverUrl: string;        // 原始URL（不下载）
  screenshotUrls: string[]; // 原始URL（不下载）
  
  // 原始链接（必须保留）
  sourceUrl: string;
  sourceId: string;
  
  // 缓存信息
  cachedAt: Date;
  expiresAt: Date;
}
```

**何时使用**：
- 当第三方API速度慢时
- 当需要离线访问元数据时
- 当需要快速搜索时

**注意事项**：
- ⚠️ 必须保留原始链接
- ⚠️ 必须定期更新缓存
- ⚠️ 必须遵守API使用条款
- ⚠️ 不能修改或转售数据

**实施代码**：

```typescript
// backend/src/services/gameCache.service.ts
import { GameLink } from '../models/gameLink.model';

export class GameCacheService {
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时

  /**
   * 缓存游戏元数据（不缓存游戏文件）
   */
  async cacheGameMetadata(game: any, source: string) {
    const gameLink = new GameLink();
    
    // 保存元数据
    gameLink.title = game.name || game.title;
    gameLink.description = game.description || game.summary || '';
    gameLink.rating = game.rating || 0;
    gameLink.genres = game.genres || [];
    gameLink.platforms = game.platforms || [];
    gameLink.releaseDate = game.released || game.first_release_date || '';
    
    // 关键：保存原始链接和ID
    gameLink.source = source;
    gameLink.sourceId = game.id;
    gameLink.sourceUrl = this.buildSourceUrl(source, game.id);
    
    // 关键：不下载封面，使用原始URL
    gameLink.coverUrl = game.background_image || game.cover?.url || '';
    
    // 保存到数据库
    await gameLink.save();
    
    return gameLink;
  }

  /**
   * 构建原始游戏链接
   */
  private buildSourceUrl(source: string, id: string | number): string {
    switch (source) {
      case 'rawg':
        return `https://rawg.io/games/${id}`;
      case 'itch':
        return `https://itch.io/games/${id}`;
      case 'igdb':
        return `https://www.igdb.com/games/${id}`;
      case 'wechat':
        return `https://minigame.qq.com/game/${id}`;
      case 'douyin':
        return `https://www.douyin.com/game/${id}`;
      default:
        return '';
    }
  }

  /**
   * 检查缓存是否过期
   */
  isExpired(cachedAt: Date): boolean {
    return Date.now() - cachedAt.getTime() > this.CACHE_DURATION;
  }

  /**
   * 更新过期的缓存
   */
  async refreshExpiredCache() {
    const expiredGames = await GameLink.find({
      where: {
        updatedAt: LessThan(new Date(Date.now() - this.CACHE_DURATION)),
      },
    });

    for (const game of expiredGames) {
      // 重新从API获取最新数据
      const freshData = await this.fetchFromSource(game.source, game.sourceId);
      game.rating = freshData.rating;
      game.description = freshData.description;
      await game.save();
    }
  }
}
```

---

### 方案3️⃣：游戏文件存储模式（不推荐 ❌）

**做法**：下载并保存游戏文件到自己的服务器

**为什么不推荐**：

| 问题 | 严重程度 | 说明 |
|------|--------|------|
| **版权侵犯** | 🔴 严重 | 违反《著作权法》 |
| **许可证违反** | 🔴 严重 | 大多数游戏禁止转发 |
| **法律风险** | 🔴 严重 | 可能被起诉 |
| **存储成本** | 🟠 中等 | 100000+游戏需要PB级存储 |
| **带宽成本** | 🟠 中等 | 每月数百万美元 |
| **维护成本** | 🟠 中等 | 需要不断更新 |
| **性能问题** | 🟡 轻微 | 下载速度慢 |

**法律后果**：
- ❌ 被游戏开发者起诉
- ❌ 被平台投诉和封禁
- ❌ 被政府部门处罚
- ❌ 项目被关闭

**不要这样做！** ⚠️

---

## ⚖️ 法律分析

### 中国法律

**《著作权法》第10条**：
> 著作权包括下列人身权和财产权：
> - 发表权
> - 署名权
> - 修改权
> - **保护作品完整权**
> - **复制权**
> - 发行权
> - 出租权
> - 展览权
> - 表演权
> - 放映权
> - 广播权
> - 信息网络传播权

**关键点**：
- ✅ 可以链接到游戏（不违反）
- ✅ 可以展示游戏信息（不违反）
- ❌ 不能复制游戏文件（违反复制权）
- ❌ 不能修改游戏（违反保护作品完整权）
- ❌ 不能在网络传播游戏（违反信息网络传播权）

**处罚**：
- 民事责任：赔偿损失
- 行政处罚：罚款、没收违法所得
- 刑事责任：情节严重可处3年以下有期徒刑

---

### 国际法律

**美国 - DMCA（数字千年版权法）**：
- 禁止绕过版权保护
- 禁止未授权复制
- 罚款：$200-$2500/件

**欧盟 - GDPR**：
- 游戏数据属于个人数据
- 必须获得明确同意
- 罚款：最高2000万欧元

**日本 - 著作权法**：
- 禁止未授权复制
- 禁止未授权传播
- 罚款：最高500万日元

---

## 🛡️ 安全合规方案

### 推荐架构

```
┌─────────────────────────────────────────────────────────┐
│                    GameHub 平台                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   RAWG API   │  │ Itch.io API  │  │  IGDB API    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│         └─────────────────┼─────────────────┘           │
│                           │                             │
│                    ┌──────▼──────┐                      │
│                    │ 聚合服务    │                      │
│                    │ (元数据)    │                      │
│                    └──────┬──────┘                      │
│                           │                             │
│                    ┌──────▼──────┐                      │
│                    │ 本地数据库  │                      │
│                    │ (链接+元数据)│                      │
│                    └──────┬──────┘                      │
│                           │                             │
│              ┌────────────┼────────────┐                │
│              │            │            │                │
│         ┌────▼────┐  ┌────▼────┐  ┌───▼────┐           │
│         │  Web    │  │  iOS    │  │Android │           │
│         │  前端   │  │  应用   │  │  应用  │           │
│         └─────────┘  └─────────┘  └────────┘           │
│                                                          │
│  用户点击游戏 → 跳转到原始平台 → 在原平台玩游戏        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 数据库设计

```typescript
// 只存储这些信息
@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 元数据（可以存储）
  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('float')
  rating: number;

  @Column('simple-array')
  genres: string[];

  // 关键：原始链接
  @Column()
  source: string;

  @Column()
  sourceId: string;

  @Column()
  sourceUrl: string; // 指向原始游戏的URL

  // 不存储游戏文件
  // 不修改游戏内容
  // 不转售游戏
}
```

---

## 📝 使用条款检查清单

在聚合任何游戏前，检查以下事项：

### RAWG
- ✅ 允许聚合：是
- ✅ 允许展示链接：是
- ⚠️ 允许缓存元数据：需要注明来源
- ❌ 允许下载游戏：否
- 📄 条款：https://rawg.io/about

### Itch.io
- ✅ 允许聚合：是
- ✅ 允许展示链接：是
- ⚠️ 允许缓存元数据：需要注明来源
- ❌ 允许下载游戏：否（除非开发者允许）
- 📄 条款：https://itch.io/terms

### IGDB
- ✅ 允许聚合：是
- ✅ 允许展示链接：是
- ⚠️ 允许缓存元数据：需要注明来源
- ❌ 允许下载游戏：否
- 📄 条款：https://api-docs.igdb.com/

### 微信小游戏
- ✅ 允许聚合：是
- ✅ 允许展示链接：是
- ⚠️ 允许缓存元数据：需要注明来源
- ❌ 允许下载游戏：否
- 📄 条款：https://developers.weixin.qq.com/

### 抖音小游戏
- ✅ 允许聚合：是
- ✅ 允许展示链接：是
- ⚠️ 允许缓存元数据：需要注明来源
- ❌ 允许下载游戏：否
- 📄 条款：https://open.douyin.com/

---

## 🎯 最佳实践

### DO ✅

```typescript
// 1. 保存原始链接
game.sourceUrl = 'https://rawg.io/games/123';

// 2. 注明来源
game.source = 'rawg';
game.sourceId = '123';

// 3. 链接到原始平台
<a href={game.sourceUrl} target="_blank">
  在{game.source}上玩游戏
</a>

// 4. 定期更新元数据
await refreshGameMetadata(game);

// 5. 尊重开发者
showDeveloperInfo(game);
showGameRating(game);
```

### DON'T ❌

```typescript
// 1. 不要下载游戏文件
downloadGameFile(game.sourceUrl); // ❌

// 2. 不要修改游戏
modifyGameContent(game); // ❌

// 3. 不要声称拥有游戏
game.owner = 'MyCompany'; // ❌

// 4. 不要转售游戏
sellGame(game); // ❌

// 5. 不要隐藏原始来源
hideSourceInfo(game); // ❌
```

---

## 📋 合规性检查表

在上线前，确保：

- [ ] 所有游戏都有原始链接
- [ ] 所有游戏都注明了来源
- [ ] 没有下载任何游戏文件
- [ ] 没有修改任何游戏内容
- [ ] 没有声称拥有任何游戏
- [ ] 没有转售任何游戏
- [ ] 有隐私政策
- [ ] 有使用条款
- [ ] 有联系方式
- [ ] 有投诉处理机制
- [ ] 定期检查链接有效性
- [ ] 定期更新游戏信息

---

## 🚨 风险管理

### 如果被投诉

1. **立即行动**
   - 停止分发相关内容
   - 保存所有证据
   - 记录投诉时间和内容

2. **联系律师**
   - 咨询知识产权律师
   - 评估法律风险
   - 制定应对方案

3. **与投诉人沟通**
   - 道歉并解释情况
   - 提供补救方案
   - 寻求和解

4. **改进流程**
   - 加强合规检查
   - 更新使用条款
   - 培训团队

### 保险建议

- 购买知识产权保险
- 购买网络责任保险
- 购买数据保护保险

---

## 📞 法律咨询资源

### 中国
- 中国版权协会：https://www.ccopyright.com.cn/
- 中国互联网协会：https://www.isc.org.cn/
- 知识产权律师：咨询当地律师事务所

### 国际
- 美国著作权局：https://www.copyright.gov/
- 欧盟知识产权办公室：https://euipo.europa.eu/
- 世界知识产权组织：https://www.wipo.int/

---

## 🎁 推荐方案总结

### 最安全的做法

```typescript
// 1. 只存储链接和元数据
const game = {
  id: 'uuid',
  title: '游戏名称',
  description: '游戏描述',
  rating: 4.5,
  source: 'rawg',
  sourceId: '123',
  sourceUrl: 'https://rawg.io/games/123', // 关键
  createdAt: new Date(),
};

// 2. 前端跳转到原始平台
function playGame(game) {
  window.open(game.sourceUrl, '_blank');
}

// 3. 显示来源信息
function showGameCard(game) {
  return (
    <div>
      <h3>{game.title}</h3>
      <p>{game.description}</p>
      <p>来源: {game.source}</p>
      <a href={game.sourceUrl} target="_blank">
        🎮 前往游戏
      </a>
    </div>
  );
}
```

**这样做的好处**：
- ✅ 完全合法
- ✅ 不侵犯版权
- ✅ 支持原作者
- ✅ 节省成本
- ✅ 降低风险

---

## 🎯 结论

| 方案 | 合法性 | 成本 | 风险 | 推荐度 |
|------|--------|------|------|--------|
| **链接聚合** | ✅ 合法 | 低 | 低 | ⭐⭐⭐⭐⭐ |
| **元数据缓存** | ⚠️ 需谨慎 | 中 | 中 | ⭐⭐⭐ |
| **文件存储** | ❌ 违法 | 高 | 高 | ❌ |

**最终建议**：采用**链接聚合模式**，这是最安全、最合法、最经济的方案！

---

**记住**：尊重版权，支持开发者，才能长期可持续发展！ 🎮
