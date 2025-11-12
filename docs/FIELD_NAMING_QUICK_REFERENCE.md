# 字段命名快速参考

## 📌 核心规则

| 层级 | 风格 | 示例 |
|------|------|------|
| 数据库 | `snake_case` | `user_id`, `created_at` |
| TypeORM实体 | `camelCase` | `userId`, `createdAt` |
| 前端 | `snake_case` | `user_id`, `created_at` |

---

## ⚡ 常用字段速查

### ID 字段
```typescript
// 实体
@PrimaryGeneratedColumn()
id: number;

@Column({ name: 'user_id' })
userId: number;

@Column({ name: 'game_id' })
gameId: number;
```

### 布尔字段（使用 is_ 前缀）
```typescript
@Column({ name: 'is_active', default: true })
isActive: boolean;

@Column({ name: 'is_featured', default: false })
isFeatured: boolean;

@Column({ name: 'is_verified', default: false })
isVerified: boolean;
```

### 时间戳
```typescript
@CreateDateColumn({ name: 'created_at' })
createdAt: Date;

@UpdateDateColumn({ name: 'updated_at' })
updatedAt: Date;

@DeleteDateColumn({ name: 'deleted_at' })
deletedAt: Date;
```

### URL 字段
```typescript
@Column({ name: 'game_url' })
gameUrl: string;

@Column({ name: 'cover_image_url' })
coverImageUrl: string;

@Column({ name: 'avatar_url' })
avatarUrl: string;
```

### 状态字段（使用 _status 后缀）
```typescript
@Column({ name: 'availability_status' })
availabilityStatus: string;

@Column({ name: 'payment_status' })
paymentStatus: string;

@Column({ name: 'membership_status' })
membershipStatus: string;
```

### 计数字段（使用 _count 后缀）
```typescript
@Column({ name: 'play_count', default: 0 })
playCount: number;

@Column({ name: 'view_count', default: 0 })
viewCount: number;

@Column({ name: 'download_count', default: 0 })
downloadCount: number;
```

### 评分字段（使用 _rating 后缀）
```typescript
@Column({ name: 'average_rating', type: 'decimal' })
averageRating: number;

@Column({ name: 'user_rating' })
userRating: number;
```

---

## 🔄 快速转换

### JavaScript/TypeScript 工具

```typescript
// CamelCase -> snake_case
const toSnake = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');

// snake_case -> CamelCase
const toCamel = (str) => str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

// 使用示例
toSnake('userId')        // 'user_id'
toSnake('coverImageUrl') // 'cover_image_url'
toCamel('user_id')       // 'userId'
toCamel('created_at')    // 'createdAt'
```

---

## 🚨 常见错误

### ❌ 错误示例
```typescript
// 错误：没有指定 name
@Column()
userId: number;  // 数据库会找 userId 列（不存在）

// 错误：使用 camelCase 作为数据库列名
@Column({ name: 'userId' })
userId: number;

// 错误：不一致的命名
@Column({ name: 'user_ID' })  // 混合大小写
userId: number;
```

### ✅ 正确示例
```typescript
// 正确：明确指定 snake_case 列名
@Column({ name: 'user_id' })
userId: number;

// 正确：使用命名策略（自动转换）
// 确保配置了 SnakeCaseNamingStrategy
@Column()
userId: number;  // 自动映射到 user_id
```

---

## 📝 实体模板

### 完整实体示例
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('table_name')
export class EntityName {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'display_name', length: 100 })
  displayName: string;

  @Column({ name: 'email_address', unique: true })
  emailAddress: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'status_type', type: 'enum', enum: ['active', 'inactive'] })
  statusType: string;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

---

## 🔍 验证脚本

运行以下命令验证字段映射：

```bash
# 后端
cd backend
npm run verify:mappings

# 或直接运行
ts-node src/scripts/verify-field-mappings.ts
```

---

## 📚 更多信息

详见：`docs/DATABASE_NAMING_CONVENTIONS.md`

---

**最后更新**: 2024-11-12

