/**
 * 文件上传控制器
 * File Upload Controller
 *
 * 处理安全的文件上传请求，提供REST API接口
 * Handles secure file upload requests and provides REST API endpoints
 */
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UploadedFiles,
  UseInterceptors,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SecureFileUploadService, UploadedFile } from '../services/secure-file-upload.service';
import { FileUploadError } from '../errors/file-upload-error';
import { FileUploadMiddleware } from '../middleware/file-upload.middleware';
import { getUploadConfigByField } from '../config/file-upload-config';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { logger } from '@/utils/logger';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class FileUploadController {
  constructor(private readonly fileUploadService: SecureFileUploadService) {}

  /**
   * 上传单个文件
   * Upload single file
   */
  @Post('single/:field')
  @UseInterceptors(FilesInterceptor('file', 1))
  async uploadSingleFile(
    @Param('field') fieldName: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any
  ) {
    try {
      if (!files || files.length === 0) {
        throw new FileUploadError('没有找到上传的文件', 'NO_FILE');
      }

      const file = files[0];
      file.fieldname = fieldName; // 设置字段名

      const config = getUploadConfigByField(fieldName);
      const uploadedFile = await this.fileUploadService.processUpload(file, config);

      logger.info('Single file uploaded successfully', {
        filename: uploadedFile.filename,
        size: uploadedFile.size,
        field: fieldName,
      });

      return {
        status: 'success',
        data: { file: uploadedFile },
        message: '文件上传成功',
      };
    } catch (error) {
      logger.error('Single file upload failed:', error as Error);
      throw this.handleUploadError(error as Error);
    }
  }

  /**
   * 上传多个文件
   * Upload multiple files
   */
  @Post('multiple/:field')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultipleFiles(
    @Param('field') fieldName: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any
  ) {
    try {
      if (!files || files.length === 0) {
        throw new FileUploadError('没有找到上传的文件', 'NO_FILES');
      }

      // 设置每个文件的字段名
      files.forEach(file => {
        file.fieldname = fieldName;
      });

      const config = getUploadConfigByField(fieldName);
      const uploadedFiles = await this.fileUploadService.processBatchUpload(files, config);

      logger.info('Multiple files uploaded successfully', {
        count: uploadedFiles.length,
        field: fieldName,
        totalSize: uploadedFiles.reduce((sum, file) => sum + file.size, 0),
      });

      return {
        status: 'success',
        data: { files: uploadedFiles },
        message: `成功上传 ${uploadedFiles.length} 个文件`,
      };
    } catch (error) {
      logger.error('Multiple files upload failed:', error as Error);
      throw this.handleUploadError(error as Error);
    }
  }

  /**
   * 上传头像
   * Upload avatar
   */
  @Post('avatar')
  @UseInterceptors(FilesInterceptor('avatar', 1))
  async uploadAvatar(
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    try {
      if (!files || files.length === 0) {
        throw new FileUploadError('没有找到头像文件', 'NO_AVATAR');
      }

      const file = files[0];
      file.fieldname = 'avatar';

      const config = getUploadConfigByField('avatar');
      const uploadedFile = await this.fileUploadService.processUpload(file, config);

      logger.info('Avatar uploaded successfully', {
        filename: uploadedFile.filename,
        size: uploadedFile.size,
        userId: (files[0] as any).userId,
      });

      return {
        status: 'success',
        data: { avatar: uploadedFile },
        message: '头像上传成功',
      };
    } catch (error) {
      logger.error('Avatar upload failed:', error as Error);
      throw this.handleUploadError(error as Error);
    }
  }

  /**
   * 上传游戏封面
   * Upload game cover
   */
  @Post('game-cover')
  @UseInterceptors(FilesInterceptor('cover', 1))
  async uploadGameCover(
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    try {
      if (!files || files.length === 0) {
        throw new FileUploadError('没有找到游戏封面文件', 'NO_COVER');
      }

      const file = files[0];
      file.fieldname = 'cover';

      const config = getUploadConfigByField('gameCover');
      const uploadedFile = await this.fileUploadService.processUpload(file, config);

      logger.info('Game cover uploaded successfully', {
        filename: uploadedFile.filename,
        size: uploadedFile.size,
        metadata: uploadedFile.metadata,
      });

      return {
        status: 'success',
        data: { cover: uploadedFile },
        message: '游戏封面上传成功',
      };
    } catch (error) {
      logger.error('Game cover upload failed:', error as Error);
      throw this.handleUploadError(error as Error);
    }
  }

  /**
   * 上传游戏截图
   * Upload game screenshots
   */
  @Post('game-screenshots')
  @UseInterceptors(FilesInterceptor('screenshots', 5))
  async uploadGameScreenshots(
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    try {
      if (!files || files.length === 0) {
        throw new FileUploadError('没有找到游戏截图文件', 'NO_SCREENSHOTS');
      }

      // 设置字段名
      files.forEach(file => {
        file.fieldname = 'screenshots';
      });

      const config = getUploadConfigByField('gameScreenshot');
      const uploadedFiles = await this.fileUploadService.processBatchUpload(files, config);

      logger.info('Game screenshots uploaded successfully', {
        count: uploadedFiles.length,
        totalSize: uploadedFiles.reduce((sum, file) => sum + file.size, 0),
      });

      return {
        status: 'success',
        data: { screenshots: uploadedFiles },
        message: `成功上传 ${uploadedFiles.length} 张游戏截图`,
      };
    } catch (error) {
      logger.error('Game screenshots upload failed:', error as Error);
      throw this.handleUploadError(error as Error);
    }
  }

  /**
   * 获取文件信息
   * Get file information
   */
  @Get('files/:filename/info')
  async getFileInfo(@Param('filename') filename: string) {
    try {
      const filePath = `secure/misc/2024/01/01/${filename}`; // 示例路径
      const info = await this.fileUploadService.getFileInfo(filePath);

      if (!info) {
        throw new HttpException('文件不存在', HttpStatus.NOT_FOUND);
      }

      return {
        status: 'success',
        data: { info },
      };
    } catch (error) {
      logger.error('Get file info failed:', error as Error);
      throw new HttpException('获取文件信息失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 删除文件
   * Delete file
   */
  @Delete('files/:filename')
  async deleteFile(@Param('filename') filename: string) {
    try {
      const filePath = `secure/misc/2024/01/01/${filename}`; // 示例路径
      const deleted = await this.fileUploadService.deleteFile(filePath);

      if (!deleted) {
        throw new HttpException('文件不存在或删除失败', HttpStatus.NOT_FOUND);
      }

      logger.info('File deleted successfully', { filename });

      return {
        status: 'success',
        message: '文件删除成功',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      logger.error('File deletion failed:', error as Error);
      throw new HttpException('文件删除失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 获取上传配置
   * Get upload configuration
   */
  @Get('config/:field')
  async getUploadConfig(@Param('field') fieldName: string) {
    try {
      const config = getUploadConfigByField(fieldName);

      return {
        status: 'success',
        data: {
          config: {
            maxFileSize: config.maxFileSize,
            allowedMimeTypes: config.allowedMimeTypes,
            allowedExtensions: config.allowedExtensions,
            maxWidth: config.maxWidth,
            maxHeight: config.maxHeight,
            quality: config.quality,
          },
        },
      };
    } catch (error) {
      logger.error('Get upload config failed:', error as Error);
      throw new HttpException('获取配置失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 处理上传错误
   * Handle upload error
   */
  private handleUploadError(error: Error): HttpException {
    if (error instanceof FileUploadError) {
      const status = FileUploadError.getHttpStatus(error.uploadErrorCode);
      return new HttpException(error.toClientResponse(), status);
    }

    return new HttpException(
      {
        status: 'error',
        message: '文件上传失败',
        error: error.message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
