# 数据库字段命名规范 - 完整总结

## 📚 文档索引

我们创建了一套完整的字段命名规范文档：

1. **DATABASE_NAMING_CONVENTIONS.md** - 完整的命名规范
2. **FIELD_NAMING_QUICK_REFERENCE.md** - 快速参考指南
3. **FIELD_MAPPING_FIXES.md** - 问题修复指南

---

## 🎯 核心原则

### 三层命名约定

```
数据库层 (PostgreSQL)    →  snake_case  →  user_id, created_at
     ↕
实体层 (TypeORM)         →  camelCase   →  userId, createdAt
     ↕
API/前端层 (JSON/TS)     →  snake_case  →  user_id, created_at
```

---

## 🔧 已实现的功能

### 1. SnakeCase 命名策略 ✅

**文件**: `backend/src/config/snake-case-naming.strategy.ts`

自动将 TypeORM 实体的 camelCase 属性转换为数据库的 snake_case 列名。

```typescript
// 实体定义（camelCase）
@Entity('users')
export class User {
  @Column()
  userId: number;  // 自动映射到 user_id
  
  @Column()
  userName: string;  // 自动映射到 user_name
}
```

### 2. 数据库配置集成 ✅

**文件**: `backend/src/config/database.config.ts`

已配置 `namingStrategy: new SnakeCaseNamingStrategy()`

### 3. 字段名转换工具 ✅

#### 后端工具
**文件**: `backend/src/utils/field-name-converter.ts`

```typescript
import { toCamelCase, toSnakeCase, objectToCamelCase } from './utils/field-name-converter';

// 字符串转换
toSnakeCase('userId')  // 'user_id'
toCamelCase('user_id') // 'userId'

// 对象转换
const snakeObj = objectToSnakeCase({ userId: 1, userName: 'John' });
// { user_id: 1, user_name: 'John' }
```

#### 前端工具
**文件**: `frontend/src/utils/field-name-converter.ts`

```typescript
import { objectToCamelCase, objectToSnakeCase } from '@/utils/field-name-converter';

// API响应转换
const apiResponse = { user_id: 1, user_name: 'John' };
const camelData = objectToCamelCase(apiResponse);
// { userId: 1, userName: 'John' }
```

### 4. 验证脚本 ✅

**文件**: `backend/src/scripts/verify-field-mappings.ts`

运行验证：
```bash
cd backend
npm run verify:mappings
```

输出示例：
```
🔍 开始验证实体字段映射...

📋 实体: User (表: users)
  ✅ id -> id
  ✅ userName -> user_name
  ✅ emailAddress -> email_address
  ✅ createdAt -> created_at

📊 验证结果汇总
总字段数: 50
✅ 正确映射: 48 (96%)
❌ 需要修复: 2 (4%)
```

---

## 📋 使用指南

### 新建实体时

#### 方法 1: 使用命名策略（推荐）

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  
  // 自动映射到 snake_case
  @Column()
  userName: string;  // -> user_name
  
  @Column()
  emailAddress: string;  // -> email_address
  
  @CreateDateColumn()
  createdAt: Date;  // -> created_at
}
```

#### 方法 2: 显式指定列名

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  
  // 显式指定数据库列名
  @Column({ name: 'user_name' })
  userName: string;
  
  @Column({ name: 'email_address' })
  emailAddress: string;
  
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### 迁移文件中

始终使用 snake_case：

```typescript
await queryRunner.createTable(
  new Table({
    name: 'users',
    columns: [
      {
        name: 'id',  // ✅ snake_case
        type: 'int',
      },
      {
        name: 'user_name',  // ✅ snake_case
        type: 'varchar',
      },
      {
        name: 'created_at',  // ✅ snake_case
        type: 'timestamp',
      },
    ],
  }),
);
```

### 前端接口定义

#### 推荐方式：使用 snake_case

```typescript
// 与 API 保持一致
export interface User {
  id: number;
  user_name: string;
  email_address: string;
  created_at: string;
}

// 使用
const user = await api.get<User>('/users/1');
console.log(user.user_name);  // ✅
```

#### 可选方式：使用转换器

```typescript
import { objectToCamelCase } from '@/utils/field-name-converter';

// API 返回 snake_case
const response = await api.get('/users/1');

// 转换为 camelCase
const user = objectToCamelCase<UserCamel>(response);
console.log(user.userName);  // ✅
```

---

## 🔍 常见字段速查

### 用户相关
| 数据库 | 实体 | 前端 | 说明 |
|--------|------|------|------|
| `user_id` | `userId` | `user_id` | 用户ID |
| `user_name` | `userName` | `user_name` | 用户名 |
| `email_address` | `emailAddress` | `email_address` | 邮箱 |
| `membership_tier` | `membershipTier` | `membership_tier` | 会员等级 |
| `point_balance` | `pointBalance` | `point_balance` | 积分余额 |
| `avatar_url` | `avatarUrl` | `avatar_url` | 头像URL |

### 游戏相关
| 数据库 | 实体 | 前端 | 说明 |
|--------|------|------|------|
| `game_id` | `gameId` | `game_id` | 游戏ID |
| `game_url` | `gameUrl` | `game_url` | 游戏URL |
| `cover_image_url` | `coverImageUrl` | `cover_image_url` | 封面图 |
| `category_tags` | `categoryTags` | `category_tags` | 分类标签 |
| `availability_status` | `availabilityStatus` | `availability_status` | 可用状态 |
| `is_featured` | `isFeatured` | `is_featured` | 是否精选 |
| `average_rating` | `averageRating` | `average_rating` | 平均评分 |
| `play_count` | `playCount` | `play_count` | 游玩次数 |

### 时间戳
| 数据库 | 实体 | 前端 | 说明 |
|--------|------|------|------|
| `created_at` | `createdAt` | `created_at` | 创建时间 |
| `updated_at` | `updatedAt` | `updated_at` | 更新时间 |
| `deleted_at` | `deletedAt` | `deleted_at` | 删除时间 |

---

## ✅ 检查清单

### 新建实体
- [ ] 所有属性使用 camelCase
- [ ] 考虑使用命名策略自动转换
- [ ] 或显式指定 `{ name: 'snake_case' }`
- [ ] 布尔字段使用 `is_` 前缀
- [ ] 时间戳使用 `@CreateDateColumn` / `@UpdateDateColumn`

### 新建迁移
- [ ] 表名使用 snake_case
- [ ] 所有列名使用 snake_case
- [ ] 索引名使用 `IDX_` 前缀
- [ ] 外键名使用 `FK_` 前缀

### 前端接口
- [ ] 使用 snake_case 与 API 保持一致
- [ ] 或使用转换器处理
- [ ] 类型定义与后端实体对应

---

## 🛠 命令速查

```bash
# 后端

# 验证字段映射
npm run verify:mappings

# 运行迁移
npm run migration:run

# 生成迁移
npm run migration:generate -- -n MigrationName

# 类型检查
npm run type-check

# 前端

# 类型检查
npm run type-check

# 构建检查
npm run build
```

---

## 📊 命名模式总结

### 1. ID 字段
```
主键: id
外键: {table}_id (例: user_id, game_id)
```

### 2. 布尔字段
```
格式: is_{property} (例: is_active, is_featured, is_verified)
```

### 3. 状态字段
```
格式: {property}_status (例: payment_status, availability_status)
```

### 4. 计数字段
```
格式: {property}_count (例: play_count, view_count, download_count)
```

### 5. 评分字段
```
格式: {property}_rating (例: average_rating, user_rating)
```

### 6. URL 字段
```
格式: {property}_url (例: game_url, cover_image_url, avatar_url)
```

### 7. 时间戳字段
```
格式: {action}_at (例: created_at, updated_at, deleted_at)
```

---

## 🚨 常见错误及解决

### 错误 1: 列不存在

**错误信息**:
```
column "userId" does not exist
```

**原因**: 实体未指定正确的数据库列名

**解决**:
```typescript
// ❌ 错误
@Column()
userId: number;

// ✅ 正确
@Column({ name: 'user_id' })
userId: number;
```

### 错误 2: 前端无法读取字段

**错误**: `user.userName` 返回 undefined

**原因**: API 返回 snake_case，前端期望 camelCase

**解决**:
```typescript
// 方案1: 使用 snake_case
const userName = user.user_name;  // ✅

// 方案2: 使用转换器
const camelUser = objectToCamelCase(user);
const userName = camelUser.userName;  // ✅
```

---

## 🎯 最佳实践

1. **一致性优先**: 在整个项目中保持命名风格一致
2. **使用工具**: 利用命名策略和转换器自动处理
3. **显式优于隐式**: 当不确定时，显式指定列名
4. **定期验证**: 运行验证脚本检查映射
5. **文档更新**: 及时更新字段映射文档

---

## 📞 获取帮助

- 详细规范: `DATABASE_NAMING_CONVENTIONS.md`
- 快速参考: `FIELD_NAMING_QUICK_REFERENCE.md`
- 问题修复: `FIELD_MAPPING_FIXES.md`
- 运行验证: `npm run verify:mappings`

---

## 📈 统计信息

### 创建的文件
- ✅ 命名策略实现
- ✅ 数据库配置更新
- ✅ 转换工具（后端）
- ✅ 转换工具（前端）
- ✅ 验证脚本
- ✅ 3个文档文件

### 命名规范覆盖
- ✅ 实体属性
- ✅ 数据库列
- ✅ 迁移文件
- ✅ 前端接口
- ✅ API响应

---

**版本**: 1.0.0  
**创建时间**: 2024-11-12  
**状态**: ✅ 生产就绪

🎉 **数据库字段命名规范已完整实现！**

