# @littlegamehub/shared

共享类型定义、常量和工具函数，用于 LittleGameHub 前后端之间的代码共享。

## 📦 安装

这是一个内部包，仅在 monorepo 内部使用。

在 backend 或 frontend 中使用：

```json
{
  "dependencies": {
    "@littlegamehub/shared": "workspace:*"
  }
}
```

## 📖 内容

### Types (类型定义)

```typescript
import { 
  ApiResponse, 
  PaginationParams, 
  PaginatedResponse,
  User,
  UserRole,
  MembershipTier,
  GameAvailabilityStatus 
} from '@littlegamehub/shared';
```

- `ApiResponse<T>` - 标准 API 响应格式
- `PaginationParams` - 分页参数
- `PaginatedResponse<T>` - 分页响应格式
- `User` - 用户信息
- `UserRole` - 用户角色枚举
- `MembershipTier` - 会员等级枚举
- `GameAvailabilityStatus` - 游戏可用状态枚举

### Constants (常量)

```typescript
import { 
  API_VERSION,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  HTTP_STATUS,
  ERROR_CODES,
  STORAGE_KEYS 
} from '@littlegamehub/shared';
```

- `API_VERSION` - API 版本号
- `DEFAULT_PAGE_SIZE` - 默认分页大小
- `MAX_PAGE_SIZE` - 最大分页大小
- `HTTP_STATUS` - HTTP 状态码常量
- `ERROR_CODES` - 错误代码常量
- `STORAGE_KEYS` - 本地存储键名

### Utils (工具函数)

```typescript
import { 
  formatDate,
  sleep,
  isEmpty,
  deepClone,
  randomString 
} from '@littlegamehub/shared';
```

- `formatDate(date)` - 格式化日期为 ISO 字符串
- `sleep(ms)` - 异步延时函数
- `isEmpty(value)` - 检查值是否为空
- `deepClone(obj)` - 深拷贝对象
- `randomString(length)` - 生成随机字符串

## 🛠️ 开发

### 构建

```bash
pnpm build
```

### 开发模式（watch）

```bash
pnpm dev
```

### 类型检查

```bash
pnpm type-check
```

## 📝 添加新内容

### 添加新类型

在 `src/types/index.ts` 中添加：

```typescript
export interface NewType {
  id: string;
  name: string;
}
```

### 添加新常量

在 `src/constants/index.ts` 中添加：

```typescript
export const NEW_CONSTANT = 'value';
```

### 添加新工具函数

在 `src/utils/index.ts` 中添加：

```typescript
export function newUtility() {
  // implementation
}
```

## 🎯 使用示例

### 在 Backend 中使用

```typescript
import { ApiResponse, HTTP_STATUS, isEmpty } from '@littlegamehub/shared';

export function handler() {
  const response: ApiResponse = {
    status: 'success',
    data: { message: 'Hello' }
  };
  
  return {
    statusCode: HTTP_STATUS.OK,
    body: JSON.stringify(response)
  };
}
```

### 在 Frontend 中使用

```typescript
import { ApiResponse, UserRole, formatDate } from '@littlegamehub/shared';

interface UserData {
  role: UserRole;
  createdAt: Date;
}

function formatUser(user: UserData) {
  return {
    role: user.role,
    joinDate: formatDate(user.createdAt)
  };
}
```

## 📄 许可证

ISC

