/**
 * 文件上传模块
 * File Upload Module
 *
 * 提供安全的文件上传功能，包括验证、处理、存储和管理
 * Provides secure file upload functionality including validation, processing, storage, and management
 */
import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FileUploadController } from './controllers/file-upload.controller';
import { SecureFileUploadService } from './services/secure-file-upload.service';
import { FileCleanupService } from './services/file-cleanup.service';
import { FileUploadMiddleware } from './middleware/file-upload.middleware';

@Module({
  imports: [ScheduleModule.forRoot()], // 启用定时任务
  controllers: [FileUploadController],
  providers: [SecureFileUploadService, FileCleanupService],
  exports: [SecureFileUploadService, FileCleanupService], // 导出服务供其他模块使用
})
export class FileUploadModule {
  /**
   * 配置中间件
   * Configure middleware
   */
  configure(consumer: MiddlewareConsumer) {
    // 为上传路由应用文件上传中间件
    consumer
      .apply(FileUploadMiddleware)
      .forRoutes(
        { path: 'upload/single/*', method: RequestMethod.POST },
        { path: 'upload/multiple/*', method: RequestMethod.POST },
        { path: 'upload/avatar', method: RequestMethod.POST },
        { path: 'upload/game-cover', method: RequestMethod.POST },
        { path: 'upload/game-screenshots', method: RequestMethod.POST }
      );
  }
}
