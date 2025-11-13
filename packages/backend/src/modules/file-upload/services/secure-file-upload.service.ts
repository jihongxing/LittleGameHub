/**
 * 安全文件上传服务
 * Secure File Upload Service
 *
 * 提供安全的文件上传、验证、处理和存储功能
 * Provides secure file upload, validation, processing, and storage functionality
 */
import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
const Jimp = require('jimp');
import { logger } from '@/utils/logger';
import { DatabaseError } from '../../../middleware';
import { FileUploadError } from '../errors/file-upload-error';

export interface FileUploadConfig {
  maxFileSize: number; // 最大文件大小（字节）
  allowedMimeTypes: string[]; // 允许的MIME类型
  allowedExtensions: string[]; // 允许的文件扩展名
  uploadPath: string; // 上传基础路径
  enableVirusScan: boolean; // 是否启用病毒扫描
  enableCompression: boolean; // 是否启用压缩
  maxWidth?: number; // 图片最大宽度
  maxHeight?: number; // 图片最大高度
  quality?: number; // 压缩质量（1-100）
}

export interface UploadedFile {
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  hash: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number; // 视频时长
    bitrate?: number; // 比特率
  };
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  detectedMimeType?: string | null;
  securityThreat?: string;
}

@Injectable()
export class SecureFileUploadService {
  private readonly DEFAULT_CONFIG: FileUploadConfig = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    uploadPath: 'uploads/secure/',
    enableVirusScan: true,
    enableCompression: true,
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
  };

  /**
   * 处理文件上传
   * Process file upload
   */
  async processUpload(
    file: Express.Multer.File,
    config?: Partial<FileUploadConfig>
  ): Promise<UploadedFile> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    try {
      // 1. 基础验证
      await this.validateBasic(file, finalConfig);

      // 2. 内容验证（检查文件签名）
      const contentValidation = await this.validateContent(file);
      if (!contentValidation.isValid) {
        throw new FileUploadError(
          `文件内容验证失败: ${contentValidation.error}`,
          'INVALID_CONTENT'
        );
      }

      // 3. 安全检查
      if (finalConfig.enableVirusScan) {
        const securityCheck = await this.performSecurityCheck(file);
        if (securityCheck.securityThreat) {
          throw new FileUploadError(
            `安全威胁检测: ${securityCheck.securityThreat}`,
            'SECURITY_THREAT'
          );
        }
      }

      // 4. 生成安全文件名
      const secureFilename = this.generateSecureFilename(file);
      const relativePath = this.getRelativePath(file.fieldname, secureFilename);
      const fullPath = path.join(finalConfig.uploadPath, relativePath);

      // 5. 确保目录存在
      await this.ensureDirectoryExists(path.dirname(fullPath));

      // 6. 处理和优化文件
      const processedFile = await this.processAndOptimizeFile(
        file,
        fullPath,
        finalConfig
      );

      // 7. 计算文件哈希
      const fileHash = await this.calculateFileHash(processedFile);

      // 8. 清理临时文件
      await this.cleanupTempFile(file.path);

      const uploadedFile: UploadedFile = {
        originalName: this.sanitizeFilename(file.originalname),
        filename: secureFilename,
        mimetype: file.mimetype,
        size: processedFile.size,
        path: relativePath,
        url: this.generateUrl(relativePath),
        hash: fileHash,
      };

      // 9. 为图片文件提取元数据
      if (this.isImageFile(file.mimetype)) {
        uploadedFile.metadata = await this.extractImageMetadata(processedFile);
      }

      logger.info('File uploaded successfully', {
        filename: uploadedFile.filename,
        size: uploadedFile.size,
        hash: uploadedFile.hash,
      });

      return uploadedFile;

    } catch (error) {
      // 清理失败的文件
      if (file.path && await this.fileExists(file.path)) {
        await this.cleanupTempFile(file.path);
      }

      logger.error('File upload failed:', error as Error);
      throw error instanceof FileUploadError ? error : new DatabaseError(`文件上传失败: ${(error as Error).message}`);
    }
  }

  /**
   * 批量处理文件上传
   * Process batch file uploads
   */
  async processBatchUpload(
    files: Express.Multer.File[],
    config?: Partial<FileUploadConfig>
  ): Promise<UploadedFile[]> {
    const results: UploadedFile[] = [];
    const errors: Error[] = [];

    for (const file of files) {
      try {
        const uploadedFile = await this.processUpload(file, config);
        results.push(uploadedFile);
      } catch (error) {
        errors.push(error as Error);
        logger.warn(`Batch upload failed for file ${file.originalname}:`, error as Error);
      }
    }

    // 如果所有文件都失败，抛出错误
    if (results.length === 0 && errors.length > 0) {
      throw new FileUploadError(`批量上传失败: ${errors.length} 个文件处理失败`, 'BATCH_UPLOAD_FAILED');
    }

    // 如果部分失败，记录警告但返回成功的结果
    if (errors.length > 0) {
      logger.warn(`Batch upload completed with ${errors.length} failures out of ${files.length} files`);
    }

    return results;
  }

  /**
   * 删除文件
   * Delete file
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.DEFAULT_CONFIG.uploadPath, filePath);

      // 防止路径遍历攻击
      if (!this.isPathSafe(fullPath)) {
        throw new FileUploadError('无效的文件路径', 'INVALID_PATH');
      }

      if (await this.fileExists(fullPath)) {
        await fs.unlink(fullPath);
        logger.info('File deleted successfully', { path: filePath });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('File deletion failed:', error as Error);
      return false;
    }
  }

  /**
   * 获取文件信息
   * Get file information
   */
  async getFileInfo(filePath: string): Promise<any | null> {
    try {
      const fullPath = path.join(this.DEFAULT_CONFIG.uploadPath, filePath);

      if (!this.isPathSafe(fullPath)) {
        throw new FileUploadError('无效的文件路径', 'INVALID_PATH');
      }

      const stats = await fs.stat(fullPath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
      };
    } catch (error) {
      logger.error('Failed to get file info:', error as Error);
      return null;
    }
  }

  /**
   * 基础文件验证
   * Basic file validation
   */
  private async validateBasic(file: Express.Multer.File, config: FileUploadConfig): Promise<void> {
    // 检查文件大小
    if (file.size > config.maxFileSize) {
      throw new FileUploadError(
        `文件过大: ${file.size} bytes, 最大允许: ${config.maxFileSize} bytes`,
        'FILE_TOO_LARGE'
      );
    }

    // 检查MIME类型
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      throw new FileUploadError(
        `不支持的文件类型: ${file.mimetype}`,
        'INVALID_MIME_TYPE'
      );
    }

    // 检查文件扩展名
    const ext = path.extname(file.originalname).toLowerCase();
    if (!config.allowedExtensions.includes(ext)) {
      throw new FileUploadError(
        `不支持的文件扩展名: ${ext}`,
        'INVALID_EXTENSION'
      );
    }

    // 检查文件名安全性
    if (!this.isFilenameSafe(file.originalname)) {
      throw new FileUploadError('不安全的文件名', 'UNSAFE_FILENAME');
    }
  }

  /**
   * 验证文件内容（基于文件签名）
   * Validate file content based on file signatures
   */
  private async validateContent(file: Express.Multer.File): Promise<FileValidationResult> {
    try {
      const buffer = await fs.readFile(file.path);
      const detectedMimeType = this.detectMimeType(buffer);

      // 检查文件签名是否与声明的MIME类型匹配
      if (detectedMimeType && detectedMimeType !== file.mimetype) {
        // 对于某些兼容的类型允许（如image/jpeg和image/jpg）
        if (!this.isCompatibleMimeType(file.mimetype, detectedMimeType)) {
          return {
            isValid: false,
            error: `文件签名不匹配: 声明为 ${file.mimetype}, 检测为 ${detectedMimeType}`,
            detectedMimeType,
          };
        }
      }

      // 检查是否为可执行文件或危险文件
      if (this.isExecutableFile(buffer) || this.isDangerousFile(buffer)) {
        return {
          isValid: false,
          securityThreat: '检测到潜在的恶意文件',
        };
      }

      return { isValid: true, detectedMimeType };
    } catch (error) {
      return {
        isValid: false,
        error: `内容验证失败: ${(error as Error).message}`,
      };
    }
  }

  /**
   * 执行安全检查
   * Perform security check
   */
  private async performSecurityCheck(file: Express.Multer.File): Promise<FileValidationResult> {
    try {
      const buffer = await fs.readFile(file.path);

      // 检查文件头是否有恶意代码特征
      const threats = this.detectMaliciousPatterns(buffer);
      if (threats.length > 0) {
        return {
          isValid: false,
          securityThreat: `检测到恶意模式: ${threats.join(', ')}`,
        };
      }

      // 检查文件熵（高熵可能表示加密或压缩的恶意代码）
      const entropy = this.calculateEntropy(buffer);
      if (entropy > 7.5) { // 经验阈值
        logger.warn('High entropy file detected', {
          filename: file.originalname,
          entropy,
        });
        // 不直接拒绝，但记录警告
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: `安全检查失败: ${(error as Error).message}`,
      };
    }
  }

  /**
   * 处理和优化文件
   * Process and optimize file
   */
  private async processAndOptimizeFile(
    file: Express.Multer.File,
    targetPath: string,
    config: FileUploadConfig
  ): Promise<{ path: string; size: number }> {
    if (this.isImageFile(file.mimetype) && config.enableCompression) {
      // 图片压缩和优化
      return await this.optimizeImage(file.path, targetPath, config);
    } else {
      // 直接复制文件
      await fs.copyFile(file.path, targetPath);
      const stats = await fs.stat(targetPath);
      return { path: targetPath, size: stats.size };
    }
  }

  /**
   * 优化图片
   * Optimize image
   */
  private async optimizeImage(
    sourcePath: string,
    targetPath: string,
    config: FileUploadConfig
  ): Promise<{ path: string; size: number }> {
    try {
      // 使用 jimp 进行图片处理
      const image = await Jimp.read(sourcePath);
      
      // 获取原始尺寸
      const originalWidth = image.getWidth();
      const originalHeight = image.getHeight();
      
      // 调整尺寸（如果需要）
      if (config.maxWidth || config.maxHeight) {
        const maxWidth = config.maxWidth || originalWidth;
        const maxHeight = config.maxHeight || originalHeight;
        
        // 保持宽高比缩放
        image.scaleToFit(maxWidth, maxHeight);
      }
      
      // 设置质量和格式
      const ext = path.extname(targetPath).toLowerCase();
      const quality = config.quality || 85;
      
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          image.quality(quality);
          break;
        case '.png':
          // PNG 不支持质量设置，但可以进行无损压缩
          break;
        default:
          // 对于其他格式，保持原样
          break;
      }
      
      // 保存处理后的图片
      await image.writeAsync(targetPath);
      const stats = await fs.stat(targetPath);
      
      logger.debug('Image optimized with jimp', {
        originalSize: `${originalWidth}x${originalHeight}`,
        newSize: `${image.getWidth()}x${image.getHeight()}`,
        fileSize: stats.size,
      });
      
      return { path: targetPath, size: stats.size };
    } catch (error) {
      logger.warn('Image optimization failed, copying original:', error as Error);
      // 优化失败时复制原始文件
      await fs.copyFile(sourcePath, targetPath);
      const stats = await fs.stat(targetPath);
      return { path: targetPath, size: stats.size };
    }
    
    /* 原始 sharp 代码 - 已替换为 jimp
    try {
      let pipeline = sharp(sourcePath);

      // 获取原始尺寸
      const metadata = await pipeline.metadata();

      // 调整尺寸（如果需要）
      if (config.maxWidth || config.maxHeight) {
        pipeline = pipeline.resize(config.maxWidth, config.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // 设置质量和格式
      const ext = path.extname(targetPath).toLowerCase();
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          pipeline = pipeline.jpeg({ quality: config.quality || 85 });
          break;
        case '.png':
          pipeline = pipeline.png({ quality: config.quality || 85 });
          break;
        case '.webp':
          pipeline = pipeline.webp({ quality: config.quality || 85 });
          break;
        default:
          // 对于其他格式，不进行压缩
          break;
      }

      await pipeline.toFile(targetPath);
      const stats = await fs.stat(targetPath);

      logger.debug('Image optimized', {
        originalSize: metadata.size,
        optimizedSize: stats.size,
        compressionRatio: metadata.size ? (stats.size / metadata.size) : 0,
      });

      return { path: targetPath, size: stats.size };
    } catch (error) {
      logger.warn('Image optimization failed, copying original:', error as Error);
      // 优化失败时复制原始文件
      await fs.copyFile(sourcePath, targetPath);
      const stats = await fs.stat(targetPath);
      return { path: targetPath, size: stats.size };
    }
    */
  }

  /**
   * 提取图片元数据
   * Extract image metadata
   */
  private async extractImageMetadata(file: { path: string }): Promise<{ width?: number; height?: number }> {
    try {
      // 使用 jimp 提取图片元数据
      const image = await Jimp.read(file.path);
      return {
        width: image.getWidth(),
        height: image.getHeight(),
      };
    } catch (error) {
      logger.warn('Failed to extract image metadata with jimp:', error as Error);
      return { width: undefined, height: undefined };
    }
    
    /* 原始 sharp 代码 - 已替换为 jimp
    try {
      const metadata = await sharp(file.path).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
      };
    } catch (error) {
      logger.warn('Failed to extract image metadata:', error as Error);
      return {};
    }
    */
  }

  /**
   * 生成安全文件名
   * Generate secure filename
   */
  private generateSecureFilename(file: Express.Multer.File): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    return `${timestamp}-${random}${ext}`;
  }

  /**
   * 获取相对路径
   * Get relative path
   */
  private getRelativePath(fieldName: string, filename: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    let category = 'misc';
    if (fieldName.includes('avatar')) category = 'avatars';
    else if (fieldName.includes('cover') || fieldName.includes('icon')) category = 'games';
    else if (fieldName.includes('screenshot')) category = 'screenshots';

    return `${category}/${year}/${month}/${day}/${filename}`;
  }

  /**
   * 计算文件哈希
   * Calculate file hash
   */
  private async calculateFileHash(file: { path: string }): Promise<string> {
    const buffer = await fs.readFile(file.path);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * 生成文件URL
   * Generate file URL
   */
  private generateUrl(relativePath: string): string {
    // 这里可以根据实际的CDN配置生成URL
    return `/uploads/${relativePath}`;
  }

  /**
   * 检测MIME类型（基于文件签名）
   * Detect MIME type based on file signatures
   */
  private detectMimeType(buffer: Buffer): string | null {
    // JPEG
    if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xD8) {
      return 'image/jpeg';
    }

    // PNG
    if (buffer.length >= 8 &&
        buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'image/png';
    }

    // GIF
    if (buffer.length >= 6 &&
        buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'image/gif';
    }

    // WebP
    if (buffer.length >= 12 &&
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return 'image/webp';
    }

    return null;
  }

  /**
   * 检查是否为兼容的MIME类型
   * Check if MIME types are compatible
   */
  private isCompatibleMimeType(declared: string, detected: string): boolean {
    const compatibilityMap: Record<string, string[]> = {
      'image/jpeg': ['image/jpg'],
      'image/jpg': ['image/jpeg'],
    };

    return compatibilityMap[declared]?.includes(detected) || false;
  }

  /**
   * 检查是否为可执行文件
   * Check if file is executable
   */
  private isExecutableFile(buffer: Buffer): boolean {
    if (buffer.length < 4) return false;

    // ELF (Linux executable)
    if (buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) {
      return true;
    }

    // PE (Windows executable)
    if (buffer[0] === 0x4D && buffer[1] === 0x5A) {
      return true;
    }

    // Mach-O (macOS executable)
    if (buffer[0] === 0xCF && buffer[1] === 0xFA && buffer[2] === 0xED && buffer[3] === 0xFE) {
      return true;
    }

    return false;
  }

  /**
   * 检查是否为危险文件
   * Check if file is dangerous
   */
  private isDangerousFile(buffer: Buffer): boolean {
    if (buffer.length < 10) return false;

    // 检查文件头是否包含危险的脚本内容
    const header = buffer.slice(0, 50).toString().toLowerCase();
    const dangerousPatterns = [
      '<script',
      'javascript:',
      'vbscript:',
      'onload=',
      'onerror=',
      'eval(',
      'function(',
    ];

    return dangerousPatterns.some(pattern => header.includes(pattern));
  }

  /**
   * 检测恶意模式
   * Detect malicious patterns
   */
  private detectMaliciousPatterns(buffer: Buffer): string[] {
    const threats: string[] = [];
    const content = buffer.toString().toLowerCase();

    // 检查常见的恶意模式
    if (content.includes('<?php')) threats.push('PHP代码');
    if (content.includes('<script') && content.includes('eval')) threats.push('JavaScript注入');
    if (content.includes('<%') && content.includes('%>')) threats.push('ASP代码');
    if (content.includes('union select') || content.includes('1=1')) threats.push('SQL注入');

    return threats;
  }

  /**
   * 计算文件熵
   * Calculate file entropy
   */
  private calculateEntropy(buffer: Buffer): number {
    const frequencies: Record<number, number> = {};

    for (const byte of buffer) {
      frequencies[byte] = (frequencies[byte] || 0) + 1;
    }

    let entropy = 0;
    const length = buffer.length;

    for (const count of Object.values(frequencies)) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }

  /**
   * 检查路径是否安全
   * Check if path is safe
   */
  private isPathSafe(filePath: string): boolean {
    const normalizedPath = path.normalize(filePath);
    const uploadBase = path.normalize(this.DEFAULT_CONFIG.uploadPath);

    // 防止路径遍历攻击
    if (!normalizedPath.startsWith(uploadBase)) {
      return false;
    }

    // 检查是否包含危险的路径元素
    const dangerous = ['..', '~', '$', '`'];
    return !dangerous.some(d => normalizedPath.includes(d));
  }

  /**
   * 检查文件名是否安全
   * Check if filename is safe
   */
  private isFilenameSafe(filename: string): boolean {
    // 检查是否包含危险字符
    const dangerous = ['..', '/', '\\', ':', '*', '?', '"', '<', '>', '|', '$', '`'];
    return !dangerous.some(d => filename.includes(d));
  }

  /**
   * 清理文件名
   * Sanitize filename
   */
  private sanitizeFilename(filename: string): string {
    return filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
  }

  /**
   * 确保目录存在
   * Ensure directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * 检查文件是否存在
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 清理临时文件
   * Cleanup temporary file
   */
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      if (await this.fileExists(filePath)) {
        await fs.unlink(filePath);
      }
    } catch (error) {
      logger.warn('Failed to cleanup temp file:', error as Error);
    }
  }

  /**
   * 检查是否为图片文件
   * Check if file is an image
   */
  private isImageFile(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }
}
