# 数据库字段命名规范 - 文档导航

## 🎯 快速开始

你遇到了数据库字段名映射问题？从这里开始！

---

## 📚 文档索引

### 1️⃣ 快速参考（最常用）

**文件**: [FIELD_NAMING_QUICK_REFERENCE.md](./FIELD_NAMING_QUICK_REFERENCE.md)

适合：需要快速查找字段名或代码模板

包含：
- ✅ 常用字段速查表
- ✅ 代码模板
- ✅ 快速转换工具
- ✅ 实体模板

**预计阅读时间**: 2-3 分钟

---

### 2️⃣ 问题修复（遇到错误时）

**文件**: [FIELD_MAPPING_FIXES.md](./FIELD_MAPPING_FIXES.md)

适合：遇到字段映射错误需要修复

包含：
- ✅ 问题识别方法
- ✅ 修复步骤指南
- ✅ 常见错误及解决方案
- ✅ 故障排除技巧

**预计阅读时间**: 5-7 分钟

---

### 3️⃣ 完整规范（深入理解）

**文件**: [DATABASE_NAMING_CONVENTIONS.md](./DATABASE_NAMING_CONVENTIONS.md)

适合：想要全面理解命名规范的原理和设计

包含：
- ✅ 核心原则说明
- ✅ TypeORM 配置详解
- ✅ 命名规则详细说明
- ✅ 完整代码示例
- ✅ 字段名对照表
- ✅ 实用工具函数

**预计阅读时间**: 15-20 分钟

---

### 4️⃣ 总结文档（全局概览）

**文件**: [NAMING_CONVENTIONS_SUMMARY.md](./NAMING_CONVENTIONS_SUMMARY.md)

适合：想要了解整体实现和使用方式

包含：
- ✅ 核心原则
- ✅ 已实现的功能
- ✅ 使用指南
- ✅ 命令速查
- ✅ 最佳实践

**预计阅读时间**: 8-10 分钟

---

### 5️⃣ 实现说明（技术细节）

**文件**: [FIELD_NAMING_IMPLEMENTATION.md](./FIELD_NAMING_IMPLEMENTATION.md)

适合：想要了解实现细节和创建的文件

包含：
- ✅ 创建的文件清单
- ✅ 核心功能说明
- ✅ 工作原理
- ✅ 使用示例
- ✅ 验证清单

**预计阅读时间**: 10-12 分钟

---

## 🎯 根据场景选择文档

### 场景 1: 我需要快速查找一个字段的正确写法

👉 查看 [快速参考](./FIELD_NAMING_QUICK_REFERENCE.md)

### 场景 2: 我遇到了 "column does not exist" 错误

👉 查看 [问题修复](./FIELD_MAPPING_FIXES.md)

### 场景 3: 我要创建一个新实体

👉 查看 [快速参考](./FIELD_NAMING_QUICK_REFERENCE.md) 的实体模板

### 场景 4: 我想深入理解整个命名规范体系

👉 查看 [完整规范](./DATABASE_NAMING_CONVENTIONS.md)

### 场景 5: 我想了解都实现了哪些功能

👉 查看 [实现说明](./FIELD_NAMING_IMPLEMENTATION.md)

---

## ⚡ 最常用的内容

### 核心规则（记住这个！）

| 层级 | 命名风格 | 示例 |
|------|----------|------|
| **数据库** | `snake_case` | `user_id`, `created_at` |
| **TypeORM** | `camelCase` | `userId`, `createdAt` |
| **前端** | `snake_case` | `user_id`, `created_at` |

### 实体定义模板

```typescript
@Entity('table_name')
export class EntityName {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### 常用命令

```bash
# 验证字段映射
npm run verify:mappings

# 类型检查
npm run type-check
```

### 转换工具

```typescript
// 后端
import { toSnakeCase, toCamelCase } from './utils/field-name-converter';

// 前端
import { objectToCamelCase } from '@/utils/field-name-converter';
```

---

## 🛠 工具和脚本

### 验证脚本

```bash
cd backend
npm run verify:mappings
```

检查所有实体的字段映射是否正确。

### 转换工具

**后端**: `backend/src/utils/field-name-converter.ts`

**前端**: `frontend/src/utils/field-name-converter.ts`

### 命名策略

**后端**: `backend/src/config/snake-case-naming.strategy.ts`

自动将 camelCase 转换为 snake_case。

---

## 📊 快速对照表

### 最常用字段

| 数据库 | 实体 | 说明 |
|--------|------|------|
| `id` | `id` | 主键 |
| `user_id` | `userId` | 用户ID |
| `game_id` | `gameId` | 游戏ID |
| `user_name` | `userName` | 用户名 |
| `email_address` | `emailAddress` | 邮箱 |
| `game_url` | `gameUrl` | 游戏URL |
| `cover_image_url` | `coverImageUrl` | 封面图 |
| `is_active` | `isActive` | 是否激活 |
| `is_featured` | `isFeatured` | 是否精选 |
| `created_at` | `createdAt` | 创建时间 |
| `updated_at` | `updatedAt` | 更新时间 |

---

## 🚨 常见错误

### ❌ 错误 1: 没有指定列名

```typescript
@Column()
userId: number;  // 数据库会找 userId 列（不存在）
```

### ✅ 正确

```typescript
@Column({ name: 'user_id' })
userId: number;
```

### ❌ 错误 2: 前端读取不到

```typescript
console.log(user.userName);  // undefined
```

### ✅ 正确

```typescript
// 方案 1: 使用 snake_case
console.log(user.user_name);

// 方案 2: 使用转换器
const camelUser = objectToCamelCase(user);
console.log(camelUser.userName);
```

---

## 💡 提示

1. **优先使用快速参考**: 大部分问题都能在快速参考中找到答案
2. **遇到错误看修复指南**: 问题修复文档有详细的排查步骤
3. **定期运行验证**: 使用 `npm run verify:mappings` 确保映射正确
4. **保持一致性**: 整个项目使用统一的命名风格

---

## 🎓 学习路径

### 初学者
1. 阅读 [快速参考](./FIELD_NAMING_QUICK_REFERENCE.md)
2. 使用实体模板创建新实体
3. 运行验证脚本检查

### 中级开发者
1. 阅读 [总结文档](./NAMING_CONVENTIONS_SUMMARY.md)
2. 了解转换工具的使用
3. 阅读 [问题修复](./FIELD_MAPPING_FIXES.md)

### 高级开发者
1. 阅读 [完整规范](./DATABASE_NAMING_CONVENTIONS.md)
2. 阅读 [实现说明](./FIELD_NAMING_IMPLEMENTATION.md)
3. 了解命名策略的实现原理

---

## 📞 获取帮助

如果文档中找不到答案，可以：

1. 运行 `npm run verify:mappings` 查看详细错误
2. 查看数据库实际列名: `psql -c "\d+ table_name"`
3. 检查 TypeORM 日志输出
4. 查看相关文档的"故障排除"章节

---

## 🔄 文档更新

**最后更新**: 2024-11-12  
**版本**: 1.0.0

---

## 📋 文档清单

- ✅ DATABASE_NAMING_CONVENTIONS.md - 完整规范
- ✅ FIELD_NAMING_QUICK_REFERENCE.md - 快速参考
- ✅ FIELD_MAPPING_FIXES.md - 问题修复
- ✅ NAMING_CONVENTIONS_SUMMARY.md - 规范总结
- ✅ FIELD_NAMING_IMPLEMENTATION.md - 实现说明
- ✅ README_NAMING_CONVENTIONS.md - 本文档

---

**🎉 Happy Coding!**

