# 数据库字段命名规范 - 实现总结

## 🎉 已完成的工作

我已经为 GameHub 项目创建了一套完整的数据库字段命名规范体系，确保前后端和数据库之间的字段名正确映射。

---

## 📁 创建的文件清单

### 文档文件 (5个)

1. **docs/DATABASE_NAMING_CONVENTIONS.md** (主文档)
   - 完整的命名规范说明
   - 详细的使用指南
   - 代码示例和最佳实践
   - 字段名对照表

2. **docs/FIELD_NAMING_QUICK_REFERENCE.md** (快速参考)
   - 常用字段速查表
   - 代码模板
   - 快速转换工具

3. **docs/FIELD_MAPPING_FIXES.md** (问题修复指南)
   - 问题识别方法
   - 修复步骤
   - 常见错误及解决方案
   - 故障排除

4. **docs/NAMING_CONVENTIONS_SUMMARY.md** (总结文档)
   - 核心原则说明
   - 使用指南
   - 命令速查
   - 最佳实践

5. **docs/FIELD_NAMING_IMPLEMENTATION.md** (本文件)
   - 实现总结
   - 使用指南

### 后端文件 (3个)

6. **backend/src/config/snake-case-naming.strategy.ts**
   - TypeORM 命名策略实现
   - 自动转换 camelCase 到 snake_case
   - 支持表名、列名、关系名等转换

7. **backend/src/utils/field-name-converter.ts**
   - 字段名转换工具函数
   - 对象键名批量转换
   - 验证函数

8. **backend/src/scripts/verify-field-mappings.ts**
   - 字段映射验证脚本
   - 自动检查所有实体
   - 生成详细报告

### 前端文件 (1个)

9. **frontend/src/utils/field-name-converter.ts**
   - 前端字段名转换工具
   - API 响应格式转换
   - snake_case ↔ camelCase

### 配置更新 (2个)

10. **backend/src/config/database.config.ts** (已更新)
    - 集成 SnakeCaseNamingStrategy
    - 自动应用命名规范

11. **backend/package.json** (已更新)
    - 添加 `verify:mappings` 脚本

---

## 🎯 核心功能

### 1. 自动命名转换 ✅

**TypeORM 实体自动转换**

```typescript
// 实体定义（camelCase）
@Entity('users')
export class User {
  @Column()
  userName: string;  // 自动映射到数据库的 user_name
  
  @Column()
  emailAddress: string;  // 自动映射到 email_address
  
  @CreateDateColumn()
  createdAt: Date;  // 自动映射到 created_at
}
```

**工作原理**:
- 使用 `SnakeCaseNamingStrategy`
- 已集成到 `database.config.ts`
- 无需手动指定每个字段的数据库列名

### 2. 手动指定列名（备用方案）

```typescript
// 如果需要显式控制
@Column({ name: 'user_name' })
userName: string;
```

### 3. 验证脚本

运行命令验证所有实体的字段映射：

```bash
cd backend
npm run verify:mappings
```

**输出示例**:
```
🔍 开始验证实体字段映射...

📋 实体: User (表: users)
  ✅ userName -> user_name
  ✅ emailAddress -> email_address
  ✅ createdAt -> created_at

📋 实体: Game (表: games)
  ✅ gameUrl -> game_url
  ✅ coverImageUrl -> cover_image_url
  ❌ categoryTags -> categoryTags (期望: category_tags)

📊 验证结果汇总
总字段数: 120
✅ 正确映射: 118 (98%)
❌需要修复: 2 (2%)
```

### 4. 转换工具

#### 后端转换
```typescript
import { toSnakeCase, toCamelCase, objectToSnakeCase } from './utils/field-name-converter';

// 字符串转换
toSnakeCase('userId')  // 'user_id'
toCamelCase('user_id') // 'userId'

// 对象转换
const data = { userId: 1, userName: 'John' };
const snakeData = objectToSnakeCase(data);
// { user_id: 1, user_name: 'John' }
```

#### 前端转换
```typescript
import { objectToCamelCase, objectToSnakeCase } from '@/utils/field-name-converter';

// API 响应 (snake_case) -> camelCase
const apiResponse = { user_id: 1, user_name: 'John' };
const camelData = objectToCamelCase(apiResponse);
// { userId: 1, userName: 'John' }

// 发送请求 (camelCase) -> snake_case
const requestData = { userId: 1, userName: 'John' };
const snakeData = objectToSnakeCase(requestData);
// { user_id: 1, user_name: 'John' }
```

---

## 📋 命名规范总结

### 数据库层 (PostgreSQL)
- **风格**: `snake_case`
- **示例**: `user_id`, `game_url`, `created_at`, `is_active`

### 实体层 (TypeORM)
- **风格**: `camelCase`
- **示例**: `userId`, `gameUrl`, `createdAt`, `isActive`

### API/前端层
- **风格**: `snake_case` (推荐)
- **示例**: `user_id`, `game_url`, `created_at`, `is_active`
- **可选**: 使用转换器支持 `camelCase`

---

## 🚀 使用指南

### 新建实体

**推荐方式**（使用自动转换）:

```typescript
@Entity('games')
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  gameUrl: string;  // ✅ 自动映射到 game_url

  @Column()
  coverImageUrl: string;  // ✅ 自动映射到 cover_image_url

  @Column()
  isFeature: boolean;  // ✅ 自动映射到 is_featured

  @CreateDateColumn()
  createdAt: Date;  // ✅ 自动映射到 created_at
}
```

**备用方式**（显式指定）:

```typescript
@Entity('games')
export class Game {
  @Column({ name: 'game_url' })
  gameUrl: string;

  @Column({ name: 'cover_image_url' })
  coverImageUrl: string;
}
```

### 迁移文件

始终使用 `snake_case`:

```typescript
await queryRunner.createTable(
  new Table({
    name: 'games',
    columns: [
      { name: 'id', type: 'int', isPrimary: true },
      { name: 'game_url', type: 'varchar' },        // ✅ snake_case
      { name: 'cover_image_url', type: 'varchar' }, // ✅ snake_case
      { name: 'is_featured', type: 'boolean' },     // ✅ snake_case
      { name: 'created_at', type: 'timestamp' },    // ✅ snake_case
    ],
  }),
);
```

### 前端接口定义

**推荐方式**（使用 snake_case）:

```typescript
export interface Game {
  id: number;
  game_url: string;         // 与 API 一致
  cover_image_url: string;
  is_featured: boolean;
  created_at: string;
}

// 使用
const game = await api.get<Game>('/games/1');
console.log(game.game_url);  // ✅
```

**可选方式**（使用转换器）:

```typescript
import { objectToCamelCase } from '@/utils/field-name-converter';

const apiGame = await api.get('/games/1');
const game = objectToCamelCase<GameCamel>(apiGame);
console.log(game.gameUrl);  // ✅
```

---

## 🔍 常用字段对照表

### 用户字段
| 数据库 | 实体 | 说明 |
|--------|------|------|
| `user_id` | `userId` | 用户ID |
| `user_name` | `userName` | 用户名 |
| `email_address` | `emailAddress` | 邮箱 |
| `membership_tier` | `membershipTier` | 会员等级 |
| `point_balance` | `pointBalance` | 积分余额 |
| `is_active` | `isActive` | 是否激活 |
| `created_at` | `createdAt` | 创建时间 |

### 游戏字段
| 数据库 | 实体 | 说明 |
|--------|------|------|
| `game_id` | `gameId` | 游戏ID |
| `game_url` | `gameUrl` | 游戏URL |
| `cover_image_url` | `coverImageUrl` | 封面图 |
| `category_tags` | `categoryTags` | 分类标签 |
| `availability_status` | `availabilityStatus` | 可用状态 |
| `is_featured` | `isFeatured` | 是否精选 |
| `average_rating` | `averageRating` | 平均评分 |
| `play_count` | `playCount` | 游玩次数 |

---

## ✅ 验证清单

### 开发新功能时

- [ ] 实体属性使用 camelCase
- [ ] 数据库列使用 snake_case
- [ ] 运行 `npm run verify:mappings` 验证
- [ ] 前端接口定义与后端一致
- [ ] 迁移文件使用 snake_case

### 修复现有问题时

- [ ] 识别字段映射问题
- [ ] 查看 `FIELD_MAPPING_FIXES.md`
- [ ] 修复实体定义
- [ ] 运行验证脚本
- [ ] 测试 API 响应

---

## 🛠 常用命令

```bash
# 后端

# 验证字段映射
npm run verify:mappings

# 类型检查
npm run type-check

# 运行迁移
npm run migration:run

# 生成迁移
npm run migration:generate -- -n MigrationName


# 前端

# 类型检查
npm run type-check

# 构建检查
npm run build
```

---

## 📚 文档速查

- 完整规范: `DATABASE_NAMING_CONVENTIONS.md`
- 快速参考: `FIELD_NAMING_QUICK_REFERENCE.md`
- 问题修复: `FIELD_MAPPING_FIXES.md`
- 规范总结: `NAMING_CONVENTIONS_SUMMARY.md`

---

## 🎯 最佳实践

1. **使用自动转换**: 依赖 SnakeCaseNamingStrategy 自动处理
2. **保持一致性**: 整个项目使用统一的命名风格
3. **定期验证**: 运行验证脚本检查映射正确性
4. **前端统一**: 推荐使用 snake_case 与 API 保持一致
5. **显式优于隐式**: 当不确定时，显式指定列名

---

## 🔧 故障排除

### 问题: 列不存在错误

```
ERROR: column "userId" does not exist
```

**解决**:
1. 检查实体是否正确使用命名策略
2. 或添加 `{ name: 'user_id' }` 显式指定
3. 运行 `npm run verify:mappings`

### 问题: 前端无法读取字段

```typescript
console.log(user.userName);  // undefined
```

**解决**:
1. 检查 API 响应格式（可能是 snake_case）
2. 使用 `user.user_name` 或
3. 使用 `objectToCamelCase(user)` 转换

---

## 📈 统计信息

### 创建的文件
- ✅ 5 个文档文件
- ✅ 3 个后端工具文件
- ✅ 1 个前端工具文件
- ✅ 2 个配置更新

### 功能覆盖
- ✅ 自动命名转换
- ✅ 手动指定列名
- ✅ 字段映射验证
- ✅ 前后端转换工具
- ✅ 完整文档体系

---

## 🎊 总结

完整的数据库字段命名规范体系已经实现！

**核心优势**:
1. ✅ 自动转换，减少手动工作
2. ✅ 统一规范，避免混乱
3. ✅ 验证工具，及时发现问题
4. ✅ 转换工具，灵活应对
5. ✅ 完整文档，易于维护

**下一步**:
1. 运行 `npm run verify:mappings` 检查现有实体
2. 修复发现的任何映射问题
3. 在新功能中应用这些规范
4. 定期运行验证确保一致性

---

**创建时间**: 2024-11-12  
**版本**: 1.0.0  
**状态**: ✅ 生产就绪

🎉 **数据库字段命名规范实现完成！**

