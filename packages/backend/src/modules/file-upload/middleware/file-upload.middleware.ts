/**
 * 文件上传中间件
 * File Upload Middleware
 *
 * 提供安全的文件上传处理，包括验证、过滤和错误处理
 * Provides secure file upload handling including validation, filtering, and error handling
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { logger } from '@/utils/logger';
import { FileUploadError } from '../errors/file-upload-error';
import { getUploadConfigByField, SECURITY_CONSTANTS } from '../config/file-upload-config';

@Injectable()
export class FileUploadMiddleware implements NestMiddleware {
  private uploadStorage: multer.StorageEngine;

  constructor() {
    this.uploadStorage = multer.diskStorage({
      destination: this.getDestination.bind(this),
      filename: this.generateFilename.bind(this),
    });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // 获取字段配置
    const fields = this.getMulterFields(req);

    // 创建multer实例
    const upload = multer({
      storage: this.uploadStorage,
      fileFilter: this.createFileFilter(),
      limits: this.getLimits(),
    });

    // 处理多字段上传
    const multerMiddleware = upload.fields(fields);

    multerMiddleware(req, res, (err: any) => {
      if (err) {
        return this.handleMulterError(err, req, res, next);
      }

      // 验证上传的文件
      try {
        this.validateUploadedFiles(req);
        next();
      } catch (error) {
        this.handleValidationError(error as Error, req, res, next);
      }
    });
  }

  /**
   * 获取multer字段配置
   * Get multer field configuration
   */
  private getMulterFields(req: Request): multer.Field[] {
    const fields: multer.Field[] = [];
    const body = req.body || {};

    // 从请求体中提取文件字段
    Object.keys(body).forEach(key => {
      if (key.startsWith('file_') || key.includes('File') || key.includes('file')) {
        const maxCount = this.getMaxCountForField(key);
        fields.push({ name: key, maxCount });
      }
    });

    // 如果没有找到字段，使用默认字段
    if (fields.length === 0) {
      fields.push(
        { name: 'avatar', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
        { name: 'icon', maxCount: 1 },
        { name: 'screenshots', maxCount: 5 },
        { name: 'files', maxCount: 10 }
      );
    }

    return fields;
  }

  /**
   * 获取字段的最大文件数量
   * Get maximum file count for field
   */
  private getMaxCountForField(fieldName: string): number {
    const limits: Record<string, number> = {
      avatar: 1,
      cover: 1,
      icon: 1,
      profile: 1,
      screenshots: 5,
      screen: 5,
      images: 10,
      files: 10,
    };

    // 精确匹配
    if (limits[fieldName]) {
      return limits[fieldName];
    }

    // 模式匹配
    if (fieldName.includes('avatar')) return 1;
    if (fieldName.includes('cover') || fieldName.includes('icon')) return 1;
    if (fieldName.includes('screenshot') || fieldName.includes('screen')) return 5;

    return 10; // 默认最大值
  }

  /**
   * 获取存储目标路径
   * Get storage destination path
   */
  private getDestination(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ): void {
    try {
      const config = getUploadConfigByField(file.fieldname);
      const tempPath = path.join(config.uploadPath, 'temp');

      // 确保临时目录存在
      fs.mkdir(tempPath, { recursive: true })
        .then(() => cb(null, tempPath))
        .catch(error => cb(error, tempPath));

    } catch (error) {
      cb(error as Error, 'uploads/temp');
    }
  }

  /**
   * 生成文件名
   * Generate filename
   */
  private generateFilename(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ): void {
    // 生成临时文件名，稍后会被安全文件名替换
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname);
    const filename = `temp_${timestamp}_${random}${ext}`;

    cb(null, filename);
  }

  /**
   * 创建文件过滤器
   * Create file filter
   */
  private createFileFilter(): multer.Options['fileFilter'] {
    return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      try {
        // 基础安全检查
        this.performBasicSecurityCheck(file);

        // 获取配置
        const config = getUploadConfigByField(file.fieldname);

        // 检查文件大小（初步检查）
        if (file.size && file.size > config.maxFileSize) {
          const error = FileUploadError.fileTooLarge(file.size, config.maxFileSize);
          cb(error);
          return;
        }

        // 检查MIME类型
        if (!config.allowedMimeTypes.includes(file.mimetype)) {
          const error = FileUploadError.invalidFileType(file.mimetype, config.allowedMimeTypes);
          cb(error);
          return;
        }

        // 检查文件扩展名
        const ext = path.extname(file.originalname).toLowerCase();
        if (!config.allowedExtensions.includes(ext)) {
          cb(new FileUploadError(
            `不支持的文件扩展名: ${ext}. 允许的扩展名: ${config.allowedExtensions.join(', ')}`,
            'INVALID_EXTENSION'
          ));
          return;
        }

        cb(null, true);

      } catch (error) {
        cb(error as Error);
      }
    };
  }

  /**
   * 获取上传限制
   * Get upload limits
   */
  private getLimits(): multer.Options['limits'] {
    return {
      fileSize: SECURITY_CONSTANTS.MAX_TOTAL_SIZE_PER_REQUEST,
      files: SECURITY_CONSTANTS.MAX_FILES_PER_REQUEST,
      fieldSize: 10 * 1024 * 1024, // 10MB field size
      fieldNameSize: 100, // 100 chars
      fields: 20, // 20 fields
    };
  }

  /**
   * 执行基础安全检查
   * Perform basic security check
   */
  private performBasicSecurityCheck(file: Express.Multer.File): void {
    // 检查文件名安全性
    if (!this.isFilenameSafe(file.originalname)) {
      throw new FileUploadError('不安全的文件名', 'UNSAFE_FILENAME');
    }

    // 检查是否为危险文件扩展名
    const ext = path.extname(file.originalname).toLowerCase();
    if (SECURITY_CONSTANTS.DANGEROUS_EXTENSIONS.includes(ext)) {
      throw new FileUploadError(`禁止上传危险文件类型: ${ext}`, 'SECURITY_THREAT');
    }

    // 检查MIME类型是否在白名单中
    if (!SECURITY_CONSTANTS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new FileUploadError(`不支持的MIME类型: ${file.mimetype}`, 'INVALID_MIME_TYPE');
    }
  }

  /**
   * 验证已上传的文件
   * Validate uploaded files
   */
  private validateUploadedFiles(req: Request): void {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    if (!files) return;

    let totalSize = 0;
    let totalFiles = 0;

    // 统计总大小和文件数
    Object.values(files).forEach(fileArray => {
      fileArray.forEach(file => {
        totalSize += file.size;
        totalFiles++;
      });
    });

    // 检查总大小限制
    if (totalSize > SECURITY_CONSTANTS.MAX_TOTAL_SIZE_PER_REQUEST) {
      throw FileUploadError.fileTooLarge(totalSize, SECURITY_CONSTANTS.MAX_TOTAL_SIZE_PER_REQUEST);
    }

    // 检查文件数量限制
    if (totalFiles > SECURITY_CONSTANTS.MAX_FILES_PER_REQUEST) {
      throw new FileUploadError(
        `文件数量过多: ${totalFiles}, 最大允许: ${SECURITY_CONSTANTS.MAX_FILES_PER_REQUEST}`,
        'TOO_MANY_FILES'
      );
    }

    logger.debug('File upload validation passed', {
      totalFiles,
      totalSize: this.formatBytes(totalSize),
    });
  }

  /**
   * 处理multer错误
   * Handle multer error
   */
  private handleMulterError(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    let error: FileUploadError;

    if (err instanceof FileUploadError) {
      error = err;
    } else if (err.code === 'LIMIT_FILE_SIZE') {
      error = FileUploadError.fileTooLarge(err.size || 0, err.limit || 0);
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error = new FileUploadError('文件数量超过限制', 'TOO_MANY_FILES');
    } else if (err.code === 'LIMIT_FIELD_KEY') {
      error = new FileUploadError('字段名过长', 'FIELD_NAME_TOO_LONG');
    } else if (err.code === 'LIMIT_FIELD_VALUE') {
      error = new FileUploadError('字段值过大', 'FIELD_VALUE_TOO_LARGE');
    } else if (err.code === 'LIMIT_FIELD_COUNT') {
      error = new FileUploadError('字段数量过多', 'TOO_MANY_FIELDS');
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      error = new FileUploadError('意外的文件字段', 'UNEXPECTED_FILE');
    } else {
      error = new FileUploadError(`文件上传失败: ${err.message}`, 'UPLOAD_FAILED');
    }

    error.statusCode = FileUploadError.getHttpStatus(error.uploadErrorCode);

    logger.warn('Multer error during file upload:', {
      error: error.message,
      code: error.uploadErrorCode,
      originalError: err.message,
    });

    next(error);
  }

  /**
   * 处理验证错误
   * Handle validation error
   */
  private handleValidationError(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    logger.warn('File validation error:', error);

    if (error instanceof FileUploadError) {
      next(error);
    } else {
      next(new FileUploadError(`文件验证失败: ${error.message}`, 'VALIDATION_FAILED'));
    }
  }

  /**
   * 检查文件名是否安全
   * Check if filename is safe
   */
  private isFilenameSafe(filename: string): boolean {
    // 检查是否包含危险字符
    const dangerous = ['..', '/', '\\', ':', '*', '?', '"', '<', '>', '|', '$', '`', '\0'];
    return !dangerous.some(d => filename.includes(d));
  }

  /**
   * 格式化字节数
   * Format bytes
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * 创建文件上传中间件工厂函数
 * Factory function to create file upload middleware
 */
export function createFileUploadMiddleware() {
  const middleware = new FileUploadMiddleware();
  return middleware.use.bind(middleware);
}

/**
 * 单文件上传中间件
 * Single file upload middleware
 */
export function uploadSingle(fieldName: string) {
  return createFileUploadMiddleware();
}

/**
 * 多文件上传中间件
 * Multiple files upload middleware
 */
export function uploadMultiple(fieldName: string, maxCount: number = 5) {
  return createFileUploadMiddleware();
}

/**
 * 字段文件上传中间件
 * Fields files upload middleware
 */
export function uploadFields(fields: { name: string; maxCount: number }[]) {
  return createFileUploadMiddleware();
}
