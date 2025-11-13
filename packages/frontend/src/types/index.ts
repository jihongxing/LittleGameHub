/**
 * 游戏相关类型定义
 */

// 游戏基本信息
export interface Game {
  id: string
  title: string
  description: string
  thumbnail: string
  screenshots: string[]
  genre: string[]
  platform: Platform[]
  developer: string
  publisher: string
  releaseDate: string
  size: number // 文件大小，以字节为单位
  version: string
  rating: number // 评分，1-5
  downloadCount: number
  isOnline: boolean // 是否需要联网
  isDownloaded: boolean // 是否已下载
  isFavorite: boolean // 是否已收藏
  downloadProgress?: number // 下载进度，0-100
  lastPlayed?: string // 最后游玩时间
  playTime?: number // 游戏时长，以分钟为单位
  tags: string[]
  language: string[]
  systemRequirements: SystemRequirements
}

// 平台类型
export type Platform = 'windows' | 'mac' | 'linux' | 'web' | 'mobile'

// 系统要求
export interface SystemRequirements {
  os: string
  processor: string
  memory: string
  graphics: string
  directX?: string
  storage: string
}

// 游戏分类
export interface GameCategory {
  id: string
  name: string
  description?: string
  icon?: string
}

// 游戏筛选参数
export interface GameFilter {
  genre?: string[]
  platform?: Platform[]
  developer?: string[]
  rating?: number
  isOnline?: boolean
  isDownloaded?: boolean
  sortBy?: 'title' | 'releaseDate' | 'rating' | 'downloadCount'
  sortOrder?: 'asc' | 'desc'
  search?: string
}

// 分页参数
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// 游戏列表响应
export interface GamesResponse {
  games: Game[]
  pagination: Pagination
}

// 用户信息
export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  joinDate: string
  lastLoginDate: string
  preferences: UserPreferences
  stats: UserStats
}

// 用户偏好设置
export interface UserPreferences {
  language: string
  theme: 'light' | 'dark' | 'auto'
  autoDownload: boolean
  downloadQuality: 'low' | 'medium' | 'high'
  notifications: NotificationSettings
  privacy: PrivacySettings
}

// 通知设置
export interface NotificationSettings {
  newGames: boolean
  updates: boolean
  recommendations: boolean
  system: boolean
}

// 隐私设置
export interface PrivacySettings {
  sharePlaytime: boolean
  shareGames: boolean
  allowRecommendations: boolean
}

// 用户统计
export interface UserStats {
  gamesPlayed: number
  totalPlaytime: number // 以分钟为单位
  favoriteGenres: string[]
  achievements: Achievement[]
}

// 成就
export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

// 下载任务
export interface DownloadTask {
  id: string
  gameId: string
  game: Game
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed'
  progress: number // 0-100
  speed: number // 下载速度，以字节/秒为单位
  downloadedSize: number // 已下载大小，以字节为单位
  totalSize: number // 总大小，以字节为单位
  createdAt: string
  completedAt?: string
  filePath?: string
}

// 收藏夹
export interface Collection {
  id: string
  name: string
  description?: string
  icon?: string
  isPublic: boolean
  games: Game[]
  createdAt: string
  updatedAt: string
}

// API响应基础类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

// 离线模式状态
export interface OfflineStatus {
  isOnline: boolean
  lastSyncTime?: string
  pendingActions: number
}

// 应用状态
export interface AppState {
  user: User | null
  isOnline: boolean
  theme: 'light' | 'dark' | 'auto'
  language: string
  notifications: Notification[]
}

// 通知
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
  action?: {
    label: string
    url?: string
    handler?: () => void
  }
}