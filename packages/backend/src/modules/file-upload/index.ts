/**
 * 文件上传模块导出
 * File Upload Module Exports
 */

// 服务
export { SecureFileUploadService, type UploadedFile, type FileUploadConfig, type FileValidationResult } from './services/secure-file-upload.service';
export { FileCleanupService } from './services/file-cleanup.service';

// 控制器
export { FileUploadController } from './controllers/file-upload.controller';

// 中间件
export { FileUploadMiddleware } from './middleware/file-upload.middleware';
// 注意：工厂函数 createFileUploadMiddleware, uploadSingle, uploadMultiple, uploadFields 不导出以避免 NestJS 依赖注入问题

// 错误类
export { FileUploadError } from './errors/file-upload-error';

// 配置
export { FILE_UPLOAD_CONFIGS, getUploadConfigByField, SECURITY_CONSTANTS, getEnvironmentConfig } from './config/file-upload-config';

// 模块
export { FileUploadModule } from './file-upload.module';
