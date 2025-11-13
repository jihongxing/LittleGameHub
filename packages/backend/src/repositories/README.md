# Repository 模式实现说明

## 概述

本项目已成功将 Controllers 从直接数据库访问模式重构为 Repository 模式。Repository 模式提供了一个抽象层，将数据访问逻辑与业务逻辑分离，使代码更易于维护、测试和扩展。

## 架构结构

```
backend/src/
├── repositories/           # Repository 层
│   ├── base.repository.ts       # 基础 Repository 类
│   ├── user.repository.ts       # 用户 Repository
│   ├── game.repository.ts       # 游戏 Repository
│   ├── favorite.repository.ts   # 收藏 Repository
│   ├── download.repository.ts   # 下载 Repository
│   └── index.ts                 # 导出所有 Repository
└── controllers/           # Controller 层
    ├── authController.ts        # 认证控制器（使用 UserRepository）
    ├── userController.ts        # 用户控制器（使用 UserRepository）
    ├── gameController.ts        # 游戏控制器（使用 GameRepository）
    ├── favoriteController.ts    # 收藏控制器（使用 FavoriteRepository）
    └── downloadController.ts    # 下载控制器（使用DownloadRepository）
```

## 主要改进

### 1. 数据访问逻辑分离

**之前**：Controllers 直接使用 TypeORM Repository
```typescript
const userRepository = getUserRepository()
const user = await userRepository.findOne({ where: { email } })
```

**之后**：Controllers 使用自定义 Repository
```typescript
const userRepository = getUserRepositoryInstance()
const user = await userRepository.findByEmail(email)
```

### 2. 业务逻辑封装

Repository 层封装了复杂的查询逻辑和业务规则：

- **用户 Repository**：
  - `findByUsername()` - 通过用户名查找
  - `findByEmail()` - 通过邮箱查找
  - `findByEmailWithPassword()` - 包含密码字段的查询
  - `findUsersWithFilters()` - 带过滤和分页的用户列表
  - `isUsernameExists()` - 检查用户名是否存在
  - `isEmailExists()` - 检查邮箱是否存在

- **游戏 Repository**：
  - `findGamesWithFilters()` - 带过滤和分页的游戏列表
  - `findActiveById()` - 查找活跃的游戏
  - `findFeaturedGames()` - 获取精选游戏
  - `findPopularGames()` - 获取热门游戏
  - `searchGames()` - 高级搜索
  - `getGameStats()` - 获取统计信息

- **收藏 Repository**：
  - `findFavoritesWithFilters()` - 带过滤的收藏列表
  - `isFavorited()` - 检查是否已收藏
  - `findUserFavoriteGames()` - 获取用户收藏的游戏
  - `getFavoriteStats()` - 获取收藏统计

- **下载 Repository**：
  - `findDownloadsWithFilters()` - 带过滤的下载列表
  - `findActiveDownloadByUserAndGame()` - 查找活跃的下载
  - `updateProgress()` - 更新下载进度
  - `pauseDownload()` / `resumeDownload()` - 暂停/恢复下载
  - `getDownloadStats()` - 获取下载统计

### 3. 统一的分页处理

所有 Repository 都实现了统一的分页接口：

```typescript
interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

### 4. 类型安全

Repository 模式提供了更好的类型安全：
- 强类型的方法参数
- 明确的返回类型
- 更好的 IDE 智能提示

## 使用方法

### 在 Controller 中使用 Repository

```typescript
import { getUserRepositoryInstance } from '../repositories'

export const someController = catchAsync(async (req, res, next) => {
  const userRepository = getUserRepositoryInstance()
  
  // 使用 Repository 的方法
  const user = await userRepository.findByEmail(email)
  const exists = await userRepository.isUsernameExists(username)
  
  // ...
})
```

### 扩展 Repository

要添加新的数据访问方法，只需在对应的 Repository 类中添加：

```typescript
export class UserRepository extends BaseRepository<User> {
  // 添加新方法
  async findActiveUsers(): Promise<User[]> {
    return await this.repository.find({
      where: { is_active: true }
    })
  }
}
```

## 已修复的问题

1. **移除 Sequelize 风格代码**：
   - `findByPk` → `findById`
   - `Model.findOne()` → `repository.findOne()`
   - `update()` / `destroy()` → TypeORM 标准方法

2. **修复未定义的方法**：
   - 移除 `buildSequelizeQueryOptions`
   - 移除 Sequelize `Op` 操作符
   - 使用 TypeORM 的查询构建器

3. **字段名称修正**：
   - `download_count` → `play_count`（Game 实体中的实际字段）
   - 注释掉不存在的字段（如 `screenshotUrls`、`filePath`）

4. **类型安全改进**：
   - 添加 `req.user` 的空值检查
   - 修复可能为 undefined 的错误

## 注意事项

### 待完善的功能

1. **游戏截图**：Game 实体中没有截图字段，需要：
   - 在 Game 实体中添加 `screenshotUrls` 字段
   - 或创建单独的 Screenshot 实体表

2. **下载文件路径**：Download 实体中没有 `filePath` 字段，只有 `downloadUrl`

这些功能已在代码中标记为 TODO。

## 优势

1. **可维护性**：数据访问逻辑集中在 Repository 层
2. **可测试性**：可以轻松 mock Repository 进行单元测试
3. **可扩展性**：添加新功能只需扩展 Repository 类
4. **代码复用**：常用查询逻辑可在多个 Controller 中复用
5. **类型安全**：完整的 TypeScript 类型支持
6. **性能优化**：可以在 Repository 层统一优化查询

## 下一步

建议的改进方向：

1. 添加缓存层（Redis）到 Repository
2. 实现数据库事务支持
3. 添加查询性能监控
4. 完善单元测试
5. 补充缺失的实体字段

## 贡献指南

添加新的 Repository 时：

1. 继承 `BaseRepository<Entity>` 类
2. 实现特定的业务查询方法
3. 使用 TypeORM 的 QueryBuilder 进行复杂查询
4. 提供清晰的方法注释
5. 确保类型安全

## 总结

Repository 模式的引入大大提高了代码质量和可维护性。所有 Controllers 现在都通过 Repository 层访问数据库，实现了关注点分离，使得代码更加清晰、易于测试和维护。

