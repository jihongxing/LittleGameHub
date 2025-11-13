/**
 * 审计模块
 * Audit Module
 *
 * 提供完整的审计日志功能，包括实体、服务、中间件和控制器
 * Provides complete audit logging functionality, including entities, services, middleware, and controllers
 */
import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogService } from './services/audit-log.service';
import { AuditLogController } from './controllers/audit-log.controller';
import { AuditMiddleware } from './middleware/audit.middleware';

@Module({
  imports: [
    // 注册审计日志实体
    TypeOrmModule.forFeature([AuditLog]),
  ],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService], // 导出服务供其他模块使用
})
export class AuditModule {
  /**
   * 配置中间件
   * Configure middleware
   */
  configure(consumer: MiddlewareConsumer) {
    // 应用审计中间件到所有路由
    consumer
      .apply(AuditMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
