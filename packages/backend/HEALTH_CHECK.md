# 健康检查与状态监控

## 🎯 功能概述

Backend 服务现在提供了友好的健康检查和状态监控页面，用于实时查看各项服务的运行状态。

## 📍 访问地址

### 1. **友好的 HTML 状态页面**

访问以下任一地址即可查看可视化状态页面：

- **根路径**: http://localhost:8000/
- **状态路径**: http://localhost:8000/status

### 2. **JSON API 接口**

用于程序化检查服务状态：

- **健康检查**: http://localhost:8000/api/health

## 🎨 页面功能

### 状态页面展示内容

#### 1. **服务总体状态**
- ✅ **Healthy**: 所有服务正常运行
- ⚠️ **Degraded**: 部分服务未知或降级
- ❌ **Unhealthy**: 存在服务故障

#### 2. **基础信息**
- 运行环境（Development / Production）
- 服务版本号
- 运行时长（Uptime）
- 最后检查时间

#### 3. **服务状态检查**

| 服务 | 检查项 | 状态显示 |
|------|--------|----------|
| **Database (PostgreSQL)** | 连接状态、查询响应时间 | 🟢 Healthy / 🔴 Unhealthy |
| **Redis** | 连接状态（待实现） | ⚪ Unknown |
| **Environment Variables** | 必需环境变量检查 | 🟢 Healthy / 🔴 Unhealthy |
| **Disk Space** | 磁盘空间检查（待实现） | ⚪ Unknown |

#### 4. **系统信息**
- 操作系统平台
- Node.js 版本
- CPU 核心数和型号
- 内存使用情况（总量/已用/空闲）

## 📊 HTTP 状态码

JSON API 接口根据服务状态返回不同的 HTTP 状态码：

| 服务状态 | HTTP 状态码 | 说明 |
|----------|-------------|------|
| Healthy | 200 OK | 所有服务正常 |
| Degraded | 207 Multi-Status | 部分服务未知或降级 |
| Unhealthy | 503 Service Unavailable | 存在服务故障 |

## 🔧 技术实现

### 文件结构

```
backend/src/
├── controllers/
│   └── healthController.ts    # 健康检查控制器
├── routes/
│   └── index.ts              # 路由配置
└── app.ts                    # 应用入口（添加状态页面路由）
```

### 核心功能

#### 1. **数据库连接检查**
```typescript
// 执行简单查询测试连接
await AppDataSource.query('SELECT 1')
```

#### 2. **环境变量检查**
```typescript
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'JWT_SECRET'
]
```

#### 3. **系统信息获取**
- 进程内存使用
- 系统总内存和可用内存
- CPU 信息
- 运行时长

## 🚀 使用场景

### 1. **开发调试**
- 快速检查服务是否正常启动
- 查看各项服务的连接状态
- 监控内存使用情况

### 2. **运维监控**
- 集成到监控系统（通过 JSON API）
- 健康检查探针（K8s liveness/readiness）
- 自动告警和故障排查

### 3. **部署验证**
- 部署后快速验证服务状态
- 检查环境变量配置是否正确
- 确认数据库连接正常

## 📝 JSON API 响应示例

```json
{
  "status": "healthy",
  "timestamp": "2025-11-13T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "development",
  "services": [
    {
      "name": "Database (PostgreSQL)",
      "status": "healthy",
      "message": "Connected",
      "responseTime": 15,
      "details": {
        "host": "localhost",
        "port": 5432,
        "database": "gamehub"
      }
    },
    {
      "name": "Redis",
      "status": "unknown",
      "message": "Redis check not implemented"
    },
    {
      "name": "Environment Variables",
      "status": "healthy",
      "message": "All required variables are set",
      "details": {
        "environment": "development",
        "port": "8000"
      }
    }
  ]
}
```

## 🔮 待实现功能

### 高优先级
- [ ] Redis 连接状态检查
- [ ] 磁盘空间监控
- [ ] API 响应时间统计

### 中优先级
- [ ] 数据库连接池状态
- [ ] 最近的错误日志
- [ ] 请求统计（QPS、响应时间分布）

### 低优先级
- [ ] 自定义检查项配置
- [ ] 历史状态记录
- [ ] 告警配置和通知

## 🛠️ 扩展开发

### 添加新的服务检查

在 `healthController.ts` 中添加新的检查函数：

```typescript
async function checkYourService(): Promise<ServiceStatus> {
  const startTime = Date.now()
  try {
    // 执行检查逻辑
    return {
      name: 'Your Service',
      status: 'healthy',
      message: 'Service is running',
      responseTime: Date.now() - startTime
    }
  } catch (error) {
    return {
      name: 'Your Service',
      status: 'unhealthy',
      message: error.message,
      responseTime: Date.now() - startTime
    }
  }
}
```

然后在 `performHealthCheck()` 函数中调用：

```typescript
const [database, redis, yourService] = await Promise.all([
  checkDatabase(),
  checkRedis(),
  checkYourService()
])
```

## 🔐 安全建议

### 生产环境配置

1. **限制访问权限**
```typescript
// 添加身份验证中间件
app.get('/', authenticateAdmin, statusPage)
```

2. **隐藏敏感信息**
```typescript
// 不要在生产环境暴露详细的数据库连接信息
if (env.NODE_ENV === 'production') {
  delete details.host
  delete details.port
}
```

3. **使用专用监控端点**
```typescript
// 将监控端点移到内部网络
app.get('/internal/status', statusPage)
```

## 📊 监控集成示例

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Prometheus 监控

```yaml
scrape_configs:
  - job_name: 'gamehub-backend'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/api/health'
```

## 💡 最佳实践

1. **定期检查**: 在开发过程中经常访问状态页面
2. **部署前验证**: 部署后立即检查所有服务状态
3. **监控告警**: 在生产环境配置自动监控和告警
4. **日志记录**: 记录健康检查失败的详细信息
5. **性能优化**: 避免健康检查影响正常业务性能

## 🎯 快速开始

1. 启动后端服务：
```bash
cd backend
npm run dev
```

2. 在浏览器中打开：
```
http://localhost:8000/
```

3. 查看服务状态，确保所有必需服务为 "Healthy" 状态

---

**注意**: 当前版本中，Redis 和磁盘空间检查功能尚未完整实现，显示为 "Unknown" 状态是正常的。

