# 字段映射修复指南

## 🎯 问题识别

### 如何发现字段映射问题？

1. **API 响应缺少字段**
   ```json
   // 期望
   { "user_id": 1, "user_name": "John" }
   
   // 实际
   { "id": 1 }  // user_name 缺失
   ```

2. **数据库查询错误**
   ```
   column "userId" does not exist
   ```

3. **前端无法读取数据**
   ```typescript
   console.log(user.user_name);  // undefined
   ```

---

## 🔧 修复步骤

### 步骤 1: 检查实体定义

找到对应的实体文件，检查 `@Column` 装饰器：

```typescript
// ❌ 错误：缺少 name 属性
@Column()
userName: string;

// ✅ 正确：明确指定数据库列名
@Column({ name: 'user_name' })
userName: string;
```

### 步骤 2: 批量修复实体

使用查找替换工具：

**查找模式**:
```regex
@Column\(\)\s+(\w+):\s+
```

**替换为**:
```typescript
@Column({ name: '$1_in_snake_case' })
$1: 
```

### 步骤 3: 验证修复

```bash
# 运行验证脚本
npm run verify:mappings

# 运行测试
npm test

# 检查 API 响应
curl http://localhost:3000/api/users/1
```

---

## 📋 常见实体修复清单

### User 实体
```typescript
@Entity('users')
export class User {
  @Column({ name: 'user_name' })
  userName: string;

  @Column({ name: 'email_address' })
  emailAddress: string;

  @Column({ name: 'membership_tier' })
  membershipTier: string;

  @Column({ name: 'point_balance' })
  pointBalance: number;
}
```

### Game 实体
```typescript
@Entity('games')
export class Game {
  @Column({ name: 'game_url' })
  gameUrl: string;

  @Column({ name: 'cover_image_url' })
  coverImageUrl: string;

  @Column({ name: 'category_tags' })
  categoryTags: string[];

  @Column({ name: 'availability_status' })
  availabilityStatus: string;

  @Column({ name: 'is_featured' })
  isFeatured: boolean;

  @Column({ name: 'average_rating' })
  averageRating: number;

  @Column({ name: 'play_count' })
  playCount: number;
}
```

### PointTransaction 实体
```typescript
@Entity('point_transactions')
export class PointTransaction {
  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'transaction_type' })
  transactionType: string;

  @Column({ name: 'point_amount' })
  pointAmount: number;

  @Column({ name: 'related_id' })
  relatedId: number;

  @Column({ name: 'related_type' })
  relatedType: string;
}
```

---

## 🔄 迁移文件修复

### 检查迁移文件中的列名

```typescript
// ✅ 正确：使用 snake_case
await queryRunner.createTable(
  new Table({
    name: 'users',
    columns: [
      {
        name: 'id',
        type: 'int',
        isPrimary: true,
      },
      {
        name: 'user_name',  // ✅ snake_case
        type: 'varchar',
      },
      {
        name: 'created_at', // ✅ snake_case
        type: 'timestamp',
      },
    ],
  }),
);
```

---

## 🎯 前端修复

### 选项 1: 使用 snake_case（推荐）

```typescript
// API 响应接口定义
export interface User {
  id: number;
  user_name: string;      // 与后端保持一致
  email_address: string;
  created_at: string;
}

// 使用
const user: User = await api.get('/users/1');
console.log(user.user_name);  // ✅
```

### 选项 2: 使用转换器

```typescript
import { objectToCamelCase } from '@/utils/field-name-converter';

// API 响应
const apiResponse = {
  id: 1,
  user_name: "John",
  created_at: "2024-01-01"
};

// 转换为 camelCase
const user = objectToCamelCase(apiResponse);
console.log(user.userName);  // ✅
console.log(user.createdAt); // ✅
```

---

## 🚀 自动化修复工具

### 创建修复脚本

```typescript
// scripts/fix-entity-mappings.ts
import * as fs from 'fs';
import * as path from 'path';

function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

function fixEntityFile(filePath: string): void {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // 匹配没有 name 的 @Column()
  const regex = /@Column\(\)\s+(\w+):/g;
  
  content = content.replace(regex, (match, propName) => {
    const columnName = toSnakeCase(propName);
    return `@Column({ name: '${columnName}' })\n  ${propName}:`;
  });
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Fixed: ${filePath}`);
}

// 遍历所有实体文件
const entitiesDir = path.join(__dirname, '../src/modules');
// ... 实现遍历逻辑
```

---

## ✅ 验证清单

修复完成后，检查以下项：

- [ ] 所有实体都明确指定了 `{ name: 'snake_case' }`
- [ ] 迁移文件使用 `snake_case` 列名
- [ ] API 测试通过
- [ ] 前端能正确读取所有字段
- [ ] 数据库查询没有错误
- [ ] TypeScript 类型检查通过

---

## 🆘 故障排除

### 问题: 修复后仍然无法访问字段

**可能原因**:
1. 数据库实际列名与代码不匹配
2. 缓存未清除
3. 实体未重新加载

**解决方法**:
```bash
# 检查数据库实际列名
psql -d gamehub_db -c "\d+ table_name"

# 清除缓存并重启
npm run clean
npm run start:dev

# 重新运行迁移
npm run migration:run
```

### 问题: TypeScript 编译错误

**可能原因**: 前端类型定义未更新

**解决方法**:
```typescript
// 更新接口定义
export interface Game {
  game_url: string;      // 添加缺失的字段
  cover_image_url: string;
  // ...
}
```

---

## 📞 需要帮助?

- 查看: `DATABASE_NAMING_CONVENTIONS.md`
- 查看: `FIELD_NAMING_QUICK_REFERENCE.md`
- 运行: `npm run verify:mappings`

---

**最后更新**: 2024-11-12

