/**
 * 文件上传配置
 * File Upload Configuration
 *
 * 定义不同类型文件的上传配置和安全策略
 * Defines upload configurations and security policies for different file types
 */
import { FileUploadConfig } from '../services/secure-file-upload.service';

export const FILE_UPLOAD_CONFIGS: Record<string, FileUploadConfig> = {
  // 头像上传配置
  avatar: {
    maxFileSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    uploadPath: 'uploads/secure/',
    enableVirusScan: true,
    enableCompression: true,
    maxWidth: 256,
    maxHeight: 256,
    quality: 85,
  },

  // 游戏封面上传配置
  gameCover: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    uploadPath: 'uploads/secure/',
    enableVirusScan: true,
    enableCompression: true,
    maxWidth: 800,
    maxHeight: 600,
    quality: 85,
  },

  // 游戏截图上传配置
  gameScreenshot: {
    maxFileSize: 8 * 1024 * 1024, // 8MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    uploadPath: 'uploads/secure/',
    enableVirusScan: true,
    enableCompression: true,
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
  },

  // 游戏图标上传配置
  gameIcon: {
    maxFileSize: 1 * 1024 * 1024, // 1MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    uploadPath: 'uploads/secure/',
    enableVirusScan: true,
    enableCompression: true,
    maxWidth: 128,
    maxHeight: 128,
    quality: 90,
  },

  // 文档上传配置
  document: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.txt', '.md'],
    uploadPath: 'uploads/secure/',
    enableVirusScan: true,
    enableCompression: false, // 文档不压缩
  },

  // 通用图片上传配置
  image: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    uploadPath: 'uploads/secure/',
    enableVirusScan: true,
    enableCompression: true,
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
  },
};

/**
 * 根据字段名获取上传配置
 * Get upload configuration by field name
 */
export function getUploadConfigByField(fieldName: string): FileUploadConfig {
  // 直接映射
  if (FILE_UPLOAD_CONFIGS[fieldName]) {
    return FILE_UPLOAD_CONFIGS[fieldName];
  }

  // 模式匹配
  if (fieldName.includes('avatar')) {
    return FILE_UPLOAD_CONFIGS.avatar;
  }

  if (fieldName.includes('cover')) {
    return FILE_UPLOAD_CONFIGS.gameCover;
  }

  if (fieldName.includes('screenshot') || fieldName.includes('screen')) {
    return FILE_UPLOAD_CONFIGS.gameScreenshot;
  }

  if (fieldName.includes('icon')) {
    return FILE_UPLOAD_CONFIGS.gameIcon;
  }

  if (fieldName.includes('document') || fieldName.includes('doc')) {
    return FILE_UPLOAD_CONFIGS.document;
  }

  if (fieldName.includes('image') || fieldName.includes('photo')) {
    return FILE_UPLOAD_CONFIGS.image;
  }

  // 默认使用通用配置
  return FILE_UPLOAD_CONFIGS.image;
}

/**
 * 安全配置常量
 * Security configuration constants
 */
export const SECURITY_CONSTANTS = {
  // 文件大小限制
  MAX_TOTAL_SIZE_PER_REQUEST: 50 * 1024 * 1024, // 50MB per request
  MAX_FILES_PER_REQUEST: 10,

  // 频率限制
  UPLOAD_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  UPLOAD_RATE_LIMIT_MAX_REQUESTS: 20,

  // 存储限制
  MAX_STORAGE_PER_USER: 500 * 1024 * 1024, // 500MB per user
  MAX_FILES_PER_USER: 100,

  // 文件保留策略
  FILE_RETENTION_DAYS: 365, // 1 year
  CLEANUP_INTERVAL_HOURS: 24,

  // 危险文件模式
  DANGEROUS_EXTENSIONS: [
    '.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.jar', '.war', '.ear',
    '.msi', '.msp', '.hta', '.cpl', '.msc', '.vbs', '.js', '.jse', '.wsf',
    '.wsh', '.ps1', '.psm1', '.psd1', '.pssc', '.reg', '.inf', '.scf', '.lnk'
  ],

  // 允许的MIME类型白名单
  ALLOWED_MIME_TYPES: [
    // 图片
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // 文档
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/markdown', 'application/rtf',
    // 压缩文件（小心处理）
    'application/zip', 'application/x-rar-compressed',
  ],
};

/**
 * 环境特定的配置覆盖
 * Environment-specific configuration overrides
 */
export function getEnvironmentConfig(): Partial<FileUploadConfig> {
  const nodeEnv = process.env.NODE_ENV || 'development';

  switch (nodeEnv) {
    case 'production':
      return {
        enableVirusScan: true,
        enableCompression: true,
        maxFileSize: 5 * 1024 * 1024, // 生产环境更严格
      };

    case 'test':
      return {
        enableVirusScan: false, // 测试环境跳过病毒扫描
        enableCompression: false, // 测试环境跳过压缩
      };

    default: // development
      return {
        enableVirusScan: process.env.ENABLE_VIRUS_SCAN === 'true',
        enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
      };
  }
}
