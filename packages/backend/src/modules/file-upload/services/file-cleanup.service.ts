/**
 * 文件清理服务
 * File Cleanup Service
 *
 * 定期清理过期和无用的文件，管理存储空间
 * Periodically cleans up expired and unused files, manages storage space
 */
import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import path from 'path';
import { Cron, CronExpression } from '@nestjs/schedule';
import { logger } from '@/utils/logger';
import { DatabaseError } from '../../../middleware';
import { SECURITY_CONSTANTS } from '../config/file-upload-config';

@Injectable()
export class FileCleanupService {
  private readonly uploadBasePath = 'uploads/secure/';
  private readonly tempPath = 'uploads/temp/';

  /**
   * 清理临时文件
   * Clean temporary files
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupTempFiles(): Promise<void> {
    try {
      logger.info('Starting temporary file cleanup');

      const tempDir = this.tempPath;
      const exists = await this.directoryExists(tempDir);

      if (!exists) {
        logger.debug('Temp directory does not exist, skipping cleanup');
        return;
      }

      const files = await fs.readdir(tempDir);
      let cleanedCount = 0;
      let cleanedSize = 0;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);

        // 删除超过1小时的临时文件
        const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
        if (ageHours > 1) {
          await fs.unlink(filePath);
          cleanedCount++;
          cleanedSize += stats.size;

          logger.debug('Cleaned temp file', {
            filename: file,
            age: `${ageHours.toFixed(1)}h`,
            size: stats.size,
          });
        }
      }

      logger.info('Temporary file cleanup completed', {
        cleanedCount,
        cleanedSize: this.formatBytes(cleanedSize),
      });

    } catch (error) {
      logger.error('Failed to cleanup temporary files:', error as Error);
    }
  }

  /**
   * 清理过期文件
   * Clean expired files
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredFiles(): Promise<void> {
    try {
      logger.info('Starting expired file cleanup');

      const baseDir = this.uploadBasePath;
      const exists = await this.directoryExists(baseDir);

      if (!exists) {
        logger.debug('Upload directory does not exist, skipping cleanup');
        return;
      }

      const retentionDays = SECURITY_CONSTANTS.FILE_RETENTION_DAYS;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      let cleanedCount = 0;
      let cleanedSize = 0;
      const errors: string[] = [];

      // 递归清理目录
      await this.cleanupDirectoryRecursive(baseDir, cutoffDate, {
        onClean: (filePath: string, size: number) => {
          cleanedCount++;
          cleanedSize += size;
        },
        onError: (filePath: string, error: Error) => {
          errors.push(`${filePath}: ${error.message}`);
        },
      });

      logger.info('Expired file cleanup completed', {
        retentionDays,
        cleanedCount,
        cleanedSize: this.formatBytes(cleanedSize),
        errors: errors.length,
      });

      if (errors.length > 0) {
        logger.warn('Errors during expired file cleanup:', errors.slice(0, 10));
      }

    } catch (error) {
      logger.error('Failed to cleanup expired files:', error as Error);
    }
  }

  /**
   * 清理大文件
   * Clean large files
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupLargeFiles(): Promise<void> {
    try {
      logger.info('Starting large file cleanup');

      const baseDir = this.uploadBasePath;
      const maxSizeBytes = 50 * 1024 * 1024; // 50MB
      const exists = await this.directoryExists(baseDir);

      if (!exists) {
        logger.debug('Upload directory does not exist, skipping cleanup');
        return;
      }

      let cleanedCount = 0;
      let cleanedSize = 0;

      await this.processDirectoryRecursive(baseDir, async (filePath: string, stats: any) => {
        if (stats.size > maxSizeBytes) {
          await fs.unlink(filePath);
          cleanedCount++;
          cleanedSize += stats.size;

          logger.warn('Cleaned large file', {
            path: filePath,
            size: this.formatBytes(stats.size),
          });
        }
      });

      logger.info('Large file cleanup completed', {
        maxSize: this.formatBytes(maxSizeBytes),
        cleanedCount,
        cleanedSize: this.formatBytes(cleanedSize),
      });

    } catch (error) {
      logger.error('Failed to cleanup large files:', error as Error);
    }
  }

  /**
   * 获取存储统计信息
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    categories: Record<string, { files: number; size: number }>;
    oldestFile?: Date;
    newestFile?: Date;
  }> {
    try {
      const baseDir = this.uploadBasePath;
      const exists = await this.directoryExists(baseDir);

      if (!exists) {
        return {
          totalFiles: 0,
          totalSize: 0,
          categories: {},
        };
      }

      let totalFiles = 0;
      let totalSize = 0;
      const categories: Record<string, { files: number; size: number }> = {};
      let oldestFile: Date | undefined;
      let newestFile: Date | undefined;

      await this.processDirectoryRecursive(baseDir, async (filePath: string, stats: any) => {
        totalFiles++;
        totalSize += stats.size;

        // 更新时间范围
        if (!oldestFile || stats.mtime < oldestFile) {
          oldestFile = stats.mtime;
        }
        if (!newestFile || stats.mtime > newestFile) {
          newestFile = stats.mtime;
        }

        // 按类别统计
        const relativePath = path.relative(baseDir, filePath);
        const category = relativePath.split(path.sep)[0] || 'misc';

        if (!categories[category]) {
          categories[category] = { files: 0, size: 0 };
        }
        categories[category].files++;
        categories[category].size += stats.size;
      });

      return {
        totalFiles,
        totalSize,
        categories,
        oldestFile,
        newestFile,
      };

    } catch (error) {
      logger.error('Failed to get storage stats:', error as Error);
      throw new DatabaseError(`获取存储统计信息失败: ${(error as Error).message}`);
    }
  }

  /**
   * 手动清理指定目录
   * Manually cleanup specified directory
   */
  async cleanupDirectory(
    directoryPath: string,
    olderThanDays: number,
    options: {
      dryRun?: boolean;
      excludePatterns?: string[];
    } = {}
  ): Promise<{
    scannedFiles: number;
    cleanedFiles: number;
    cleanedSize: number;
    errors: string[];
  }> {
    try {
      const { dryRun = false, excludePatterns = [] } = options;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      let scannedFiles = 0;
      let cleanedFiles = 0;
      let cleanedSize = 0;
      const errors: string[] = [];

      logger.info('Starting manual directory cleanup', {
        directory: directoryPath,
        olderThanDays,
        dryRun,
      });

      await this.cleanupDirectoryRecursive(directoryPath, cutoffDate, {
        excludePatterns,
        dryRun,
        onClean: (filePath: string, size: number) => {
          cleanedFiles++;
          cleanedSize += size;
        },
        onError: (filePath: string, error: Error) => {
          errors.push(`${filePath}: ${error.message}`);
        },
        onScan: () => {
          scannedFiles++;
        },
      });

      logger.info('Manual directory cleanup completed', {
        directory: directoryPath,
        scannedFiles,
        cleanedFiles,
        cleanedSize: this.formatBytes(cleanedSize),
        errors: errors.length,
      });

      return {
        scannedFiles,
        cleanedFiles,
        cleanedSize,
        errors,
      };

    } catch (error) {
      logger.error('Failed to cleanup directory:', error as Error);
      throw new DatabaseError(`目录清理失败: ${(error as Error).message}`);
    }
  }

  /**
   * 递归清理目录
   * Recursively cleanup directory
   */
  private async cleanupDirectoryRecursive(
    dirPath: string,
    cutoffDate: Date,
    options: {
      excludePatterns?: string[];
      dryRun?: boolean;
      onClean?: (filePath: string, size: number) => void;
      onError?: (filePath: string, error: Error) => void;
      onScan?: () => void;
    } = {}
  ): Promise<void> {
    const {
      excludePatterns = [],
      dryRun = false,
      onClean,
      onError,
      onScan,
    } = options;

    try {
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);

        try {
          const stats = await fs.stat(itemPath);

          // 检查是否在排除模式中
          if (excludePatterns.some(pattern => item.includes(pattern))) {
            continue;
          }

          if (stats.isDirectory()) {
            // 递归处理子目录
            await this.cleanupDirectoryRecursive(itemPath, cutoffDate, options);
          } else if (stats.isFile()) {
            onScan?.();

            // 检查文件是否过期
            if (stats.mtime < cutoffDate) {
              if (!dryRun) {
                await fs.unlink(itemPath);
              }

              onClean?.(itemPath, stats.size);

              logger.debug('Cleaned expired file', {
                path: itemPath,
                age: `${((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24)).toFixed(1)} days`,
                size: stats.size,
                dryRun,
              });
            }
          }
        } catch (error) {
          onError?.(itemPath, error as Error);
        }
      }
    } catch (error) {
      onError?.(dirPath, error as Error);
    }
  }

  /**
   * 递归处理目录中的所有文件
   * Recursively process all files in directory
   */
  private async processDirectoryRecursive(
    dirPath: string,
    processor: (filePath: string, stats: any) => Promise<void>
  ): Promise<void> {
    try {
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);

        try {
          const stats = await fs.stat(itemPath);

          if (stats.isDirectory()) {
            // 递归处理子目录
            await this.processDirectoryRecursive(itemPath, processor);
          } else if (stats.isFile()) {
            await processor(itemPath, stats);
          }
        } catch (error) {
          logger.warn('Failed to process item:', {
            path: itemPath,
            error: (error as Error).message,
          });
        }
      }
    } catch (error) {
      logger.warn('Failed to process directory:', {
        path: dirPath,
        error: (error as Error).message,
      });
    }
  }

  /**
   * 检查目录是否存在
   * Check if directory exists
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * 格式化字节数
   * Format bytes
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
