/**
 * 应用常量定义
 */

// API端点
export const API_ENDPOINTS = {
  // 游戏相关
  GAMES: '/api/games',
  GAME_DETAIL: (id: string) => `/api/games/${id}`,
  GAME_DOWNLOAD: (id: string) => `/api/games/${id}/download`,
  
  // 用户相关
  USER: '/api/user',
  USER_PREFERENCES: '/api/user/preferences',
  USER_STATS: '/api/user/stats',
  
  // 收藏相关
  FAVORITES: '/api/favorites',
  COLLECTIONS: '/api/collections',
  
  // 下载相关
  DOWNLOADS: '/api/downloads',
  DOWNLOAD_TASK: (id: string) => `/api/downloads/${id}`,
  
  // 搜索相关
  SEARCH: '/api/search',
  SEARCH_SUGGESTIONS: '/api/search/suggestions',
  
  // 分类相关
  CATEGORIES: '/api/categories',
  GENRES: '/api/genres',
} as const

// 本地存储键名
export const STORAGE_KEYS = {
  USER_TOKEN: 'gamehub_token',
  USER_PREFERENCES: 'gamehub_preferences',
  FAVORITE_GAMES: 'gamehub_favorites',
  DOWNLOAD_TASKS: 'gamehub_downloads',
  OFFLINE_GAMES: 'gamehub_offline_games',
  LAST_SYNC_TIME: 'gamehub_last_sync',
  THEME: 'gamehub_theme',
  LANGUAGE: 'gamehub_language',
} as const

// 游戏平台
export const PLATFORMS = {
  WINDOWS: 'windows',
  MAC: 'mac',
  LINUX: 'linux',
  WEB: 'web',
  MOBILE: 'mobile',
} as const

// 游戏类型
export const GENRES = {
  ACTION: 'action',
  ADVENTURE: 'adventure',
  RPG: 'rpg',
  STRATEGY: 'strategy',
  SIMULATION: 'simulation',
  SPORTS: 'sports',
  RACING: 'racing',
  PUZZLE: 'puzzle',
  CASUAL: 'casual',
  HORROR: 'horror',
  FPS: 'fps',
  MMO: 'mmo',
} as const

// 下载状态
export const DOWNLOAD_STATUS = {
  PENDING: 'pending',
  DOWNLOADING: 'downloading',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

// 主题
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const

// 语言
export const LANGUAGES = {
  ZH_CN: 'zh-cn',
  EN_US: 'en-us',
  JA_JP: 'ja-jp',
  KO_KR: 'ko-kr',
} as const

// 文件大小单位
export const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const

// 分页默认配置
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

// 游戏评分等级
export const RATING_LEVELS = {
  EXCELLENT: { min: 4.5, label: '优秀', color: '#52c41a' },
  GOOD: { min: 3.5, max: 4.5, label: '良好', color: '#1890ff' },
  AVERAGE: { min: 2.5, max: 3.5, label: '一般', color: '#faad14' },
  POOR: { max: 2.5, label: '较差', color: '#f5222d' },
} as const

// 通知类型
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const

// 离线模式配置
export const OFFLINE_CONFIG = {
  // 最大离线缓存大小（以字节为单位）
  MAX_CACHE_SIZE: 5 * 1024 * 1024 * 1024, // 5GB
  // 离线数据同步间隔（以毫秒为单位）
  SYNC_INTERVAL: 30 * 60 * 1000, // 30分钟
  // 离线模式检测间隔（以毫秒为单位）
  OFFLINE_CHECK_INTERVAL: 10 * 1000, // 10秒
} as const

// 下载配置
export const DOWNLOAD_CONFIG = {
  // 最大同时下载数
  MAX_CONCURRENT_DOWNLOADS: 3,
  // 下载超时时间（以毫秒为单位）
  TIMEOUT: 30 * 1000, // 30秒
  // 下载重试次数
  MAX_RETRIES: 3,
  // 分片大小（以字节为单位）
  CHUNK_SIZE: 1024 * 1024, // 1MB
} as const

// 应用信息
export const APP_INFO = {
  NAME: 'GameHub',
  VERSION: '1.0.0',
  DESCRIPTION: '游戏聚合平台',
  AUTHOR: 'GameHub Team',
  HOMEPAGE: 'https://gamehub.com',
} as const

// 路由路径
export const ROUTES = {
  HOME: '/',
  GAMES: '/games',
  GAME_DETAIL: (id: string) => `/games/${id}`,
  FAVORITES: '/favorites',
  DOWNLOADS: '/downloads',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  SEARCH: '/search',
  COLLECTION: (id: string) => `/collection/${id}`,
} as const

// 错误代码
export const ERROR_CODES = {
  // 网络错误
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // 认证错误
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // 资源错误
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  
  // 下载错误
  DOWNLOAD_FAILED: 'DOWNLOAD_FAILED',
  STORAGE_FULL: 'STORAGE_FULL',
  
  // 离线错误
  OFFLINE_MODE: 'OFFLINE_MODE',
  SYNC_FAILED: 'SYNC_FAILED',
} as const

// 正则表达式
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
} as const