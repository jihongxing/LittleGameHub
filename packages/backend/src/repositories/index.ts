/**
 * Repository Index
 * 仓库索引
 * 
 * 导出所有 Repository 类和实例
 */

export * from './base.repository'
export * from './user.repository'
export * from './game.repository'
export * from './favorite.repository'
export * from './download.repository'

// 重新导出实例获取方法
export { getUserRepositoryInstance } from './user.repository'
export { getGameRepositoryInstance } from './game.repository'
export { getFavoriteRepositoryInstance } from './favorite.repository'
export { getDownloadRepositoryInstance } from './download.repository'

