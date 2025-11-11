import { startServer } from './app'

// 启动服务器
startServer().catch(error => {
  console.error('启动服务器失败:', error)
  process.exit(1)
})