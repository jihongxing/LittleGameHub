# 数据库字段命名规范

## 📋 概述

本文档定义了 GameHub 项目中数据库字段、实体属性、API 接口的统一命名规范，确保前后端和数据库之间的正确映射。

---

## 🎯 核心原则

### 1. 命名风格约定

| 层级 | 命名风格 | 示例 |
|------|----------|------|
| **数据库列名** | snake_case | `user_id`, `created_at`, `membership_tier` |
| **TypeORM 实体** | camelCase | `userId`, `createdAt`, `membershipTier` |
| **前端 TypeScript** | camelCase | `userId`, `createdAt`, `membershipTier` |
| **API JSON** | snake_case | `user_id`, `created_at`, `membership_tier` |

### 2. 为什么这样设计？

- **数据库 snake_case**: PostgreSQL 传统惯例，可读性好
- **TypeScript camelCase**: JavaScript/TypeScript 标准命名风格
- **API snake_case**: RESTful API 常见惯例，与数据库一致

---

## 🔧 TypeORM 字段映射配置

### 方法一：使用 @Column 装饰器的 name 属性（推荐）

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_name' })
  userName: string;

  @Column({ name: 'email_address' })
  emailAddress: string;

  @Column({ name: 'membership_tier' })
  membershipTier: string;

  @Column({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_at' })
  updatedAt: Date;
}
```

### 方法二：全局命名策略（已配置）

在 `database.config.ts` 中配置：

```typescript
import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';

export class SnakeCaseNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  tableName(targetName: string, userSpecifiedName: string): string {
    return userSpecifiedName ? userSpecifiedName : snakeCase(targetName);
  }

  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    return customName ? customName : snakeCase(embeddedPrefixes.join('_')) + snakeCase(propertyName);
  }

  relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCase(relationName + '_' + referencedColumnName);
  }

  joinTableName(firstTableName: string, secondTableName: string): string {
    return snakeCase(firstTableName + '_' + secondTableName);
  }

  joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return snakeCase(tableName + '_' + (columnName ? columnName : propertyName));
  }
}

// 在 TypeORM 配置中使用
export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  // ... other config
  namingStrategy: new SnakeCaseNamingStrategy(),
});
```

---

## 📝 命名规则详解

### 1. 主键和外键

```typescript
// 主键
@PrimaryGeneratedColumn()
id: number;  // 数据库: id

// 外键
@Column({ name: 'user_id' })
userId: number;  // 数据库: user_id

@Column({ name: 'game_id' })
gameId: number;  // 数据库: game_id
```

### 2. 时间戳字段

```typescript
@CreateDateColumn({ name: 'created_at' })
createdAt: Date;  // 数据库: created_at

@UpdateDateColumn({ name: 'updated_at' })
updatedAt: Date;  // 数据库: updated_at

@Column({ name: 'deleted_at', nullable: true })
deletedAt: Date | null;  // 数据库: deleted_at
```

### 3. 布尔字段

```typescript
// 使用 is_ 前缀
@Column({ name: 'is_active', default: true })
isActive: boolean;  // 数据库: is_active

@Column({ name: 'is_verified', default: false })
isVerified: boolean;  // 数据库: is_verified

@Column({ name: 'is_featured', default: false })
isFeatured: boolean;  // 数据库: is_featured
```

### 4. 枚举字段

```typescript
// 状态字段使用 _status 后缀
@Column({ 
  name: 'availability_status',
  type: 'enum',
  enum: ['active', 'inactive', 'maintenance']
})
availabilityStatus: string;  // 数据库: availability_status

@Column({ 
  name: 'membership_tier',
  type: 'enum',
  enum: ['free', 'member', 'offline_member']
})
membershipTier: string;  // 数据库: membership_tier
```

### 5. JSON 字段

```typescript
@Column({ name: 'metadata', type: 'jsonb', nullable: true })
metadata: Record<string, any>;  // 数据库: metadata

@Column({ name: 'game_state', type: 'jsonb', nullable: true })
gameState: Record<string, any>;  // 数据库: game_state
```

### 6. 数值字段

```typescript
// 计数字段使用 _count 后缀
@Column({ name: 'play_count', default: 0 })
playCount: number;  // 数据库: play_count

@Column({ name: 'view_count', default: 0 })
viewCount: number;  // 数据库: view_count

// 评分字段使用 _rating 后缀
@Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, nullable: true })
averageRating: number | null;  // 数据库: average_rating
```

---

## 🔄 自动转换配置

### 后端：实体到 JSON 的序列化

在 `main.ts` 中配置全局序列化：

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(3000);
}
```

### 前端：API 响应的类型定义

```typescript
// frontend/src/types/api.ts
export interface User {
  id: number;
  user_name: string;        // API 使用 snake_case
  email_address: string;
  membership_tier: string;
  created_at: string;
  updated_at: string;
}

// 如果需要 camelCase，可以创建转换函数
export function toCamelCase<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase) as any;
  }
  
  if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  
  return obj;
}
```

---

## 📋 完整示例

### 数据库表定义

```sql
CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  game_url VARCHAR(500) NOT NULL,
  cover_image_url VARCHAR(500),
  category_tags TEXT[],
  availability_status VARCHAR(50) DEFAULT 'active',
  is_featured BOOLEAN DEFAULT false,
  average_rating DECIMAL(3,2),
  play_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### TypeORM 实体

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'game_url', length: 500 })
  gameUrl: string;

  @Column({ name: 'cover_image_url', length: 500, nullable: true })
  coverImageUrl: string | null;

  @Column({ name: 'category_tags', type: 'text', array: true, default: [] })
  categoryTags: string[];

  @Column({ 
    name: 'availability_status',
    type: 'varchar',
    length: 50,
    default: 'active'
  })
  availabilityStatus: string;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ 
    name: 'average_rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true
  })
  averageRating: number | null;

  @Column({ name: 'play_count', default: 0 })
  playCount: number;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### 前端 TypeScript 接口

```typescript
// 选项 1: 使用 snake_case 与 API 保持一致
export interface Game {
  id: number;
  title: string;
  description: string | null;
  game_url: string;
  cover_image_url: string | null;
  category_tags: string[];
  availability_status: string;
  is_featured: boolean;
  average_rating: number | null;
  play_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// 选项 2: 使用 camelCase（需要转换）
export interface GameCamel {
  id: number;
  title: string;
  description: string | null;
  gameUrl: string;
  coverImageUrl: string | null;
  categoryTags: string[];
  availabilityStatus: string;
  isFeatured: boolean;
  averageRating: number | null;
  playCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🔍 常见问题和解决方案

### 问题 1: 字段名不匹配

**症状**: 前端无法读取某些字段
```typescript
// 错误：实体使用 camelCase 但没有指定数据库列名
@Column()
userId: number;  // ❌ 数据库查找 userId 列（不存在）
```

**解决**:
```typescript
// 正确：明确指定数据库列名
@Column({ name: 'user_id' })
userId: number;  // ✅ 数据库查找 user_id 列
```

### 问题 2: API 响应字段名不一致

**症状**: 前端期望 camelCase 但 API 返回 snake_case

**解决方案 A**: 前端使用 snake_case（推荐）
```typescript
interface User {
  user_id: number;  // 与 API 保持一致
  created_at: string;
}
```

**解决方案 B**: 使用转换函数
```typescript
const user = toCamelCase<UserCamel>(apiResponse);
```

### 问题 3: 迁移文件中的列名

**正确方式**:
```typescript
await queryRunner.createTable(
  new Table({
    name: 'users',
    columns: [
      {
        name: 'id',  // ✅ 使用 snake_case
        type: 'int',
        isPrimary: true,
      },
      {
        name: 'user_name',  // ✅ 使用 snake_case
        type: 'varchar',
      },
      {
        name: 'created_at',  // ✅ 使用 snake_case
        type: 'timestamp',
      },
    ],
  }),
);
```

---

## 📊 字段名对照表

### 用户相关

| 数据库 | 实体 | 前端 | 说明 |
|--------|------|------|------|
| `user_id` | `userId` | `user_id` | 用户ID |
| `user_name` | `userName` | `user_name` | 用户名 |
| `email_address` | `emailAddress` | `email_address` | 邮箱 |
| `membership_tier` | `membershipTier` | `membership_tier` | 会员等级 |
| `point_balance` | `pointBalance` | `point_balance` | 积分余额 |

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

### 新增实体时

- [ ] 所有列都使用 `@Column({ name: 'snake_case' })`
- [ ] 实体属性使用 camelCase
- [ ] 时间戳使用 `@CreateDateColumn` 和 `@UpdateDateColumn`
- [ ] 布尔字段使用 `is_` 前缀
- [ ] 外键使用 `_id` 后缀

### 新增迁移时

- [ ] 表名使用 snake_case
- [ ] 列名使用 snake_case
- [ ] 索引名使用 `IDX_` 前缀

### 前端接口定义时

- [ ] 使用 snake_case 与 API 保持一致
- [ ] 或者提供 camelCase 转换
- [ ] 类型定义与后端实体对应

---

## 🛠 实用工具

### TypeScript 类型转换工具

```typescript
// utils/case-converter.ts

/**
 * 将 snake_case 对象转换为 camelCase
 */
export function toCamelCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase) as any;
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any) as T;
  }
  
  return obj;
}

/**
 * 将 camelCase 对象转换为 snake_case
 */
export function toSnakeCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase) as any;
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {} as any) as T;
  }
  
  return obj;
}
```

---

## 📚 参考资料

- [PostgreSQL 命名约定](https://www.postgresql.org/docs/current/sql-syntax-lexical.html)
- [TypeORM 命名策略](https://typeorm.io/#/naming-strategy)
- [RESTful API 设计指南](https://restfulapi.net/resource-naming/)

---

**版本**: 1.0.0  
**最后更新**: 2024-11-12  
**状态**: 生产使用

