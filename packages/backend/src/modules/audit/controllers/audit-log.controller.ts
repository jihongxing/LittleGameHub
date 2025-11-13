/**
 * 审计日志控制器
 * Audit Log Controller
 *
 * 提供审计日志查询、管理和统计API
 * Provides audit log querying, management, and statistics APIs
 */
import { Controller, Get, Query, Param, Delete, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuditLogService } from '../services/audit-log.service';
import { AuditLogQuery, AuditLogStats } from '../entities/audit-log.entity';
import { AuditEventType, AuditSeverity, AuditStatus } from '../entities/audit-log.entity';

@Controller('audit')
// @UseGuards(requireAdmin) // 只有管理员可以访问审计日志 (临时禁用 - 需要转换为NestJS Guard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * 查询审计日志
   * Query audit logs
   */
  @Get('logs')
  async getAuditLogs(
    @Query() query: {
      userId?: string;
      eventType?: AuditEventType;
      severity?: AuditSeverity;
      status?: AuditStatus;
      ipAddress?: string;
      resourceType?: string;
      resourceId?: string;
      startDate?: string;
      endDate?: string;
      limit?: string;
      offset?: string;
    }
  ) {
    try {
      const auditQuery: AuditLogQuery = {
        userId: query.userId,
        eventType: query.eventType,
        severity: query.severity,
        status: query.status,
        ipAddress: query.ipAddress,
        resourceType: query.resourceType,
        resourceId: query.resourceId,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        limit: query.limit ? parseInt(query.limit, 10) : 50,
        offset: query.offset ? parseInt(query.offset, 10) : 0,
      };

      const result = await this.auditLogService.queryLogs(auditQuery);

      return {
        status: 'success',
        data: {
          logs: result.logs,
          pagination: {
            total: result.total,
            limit: auditQuery.limit,
            offset: auditQuery.offset,
            hasMore: (auditQuery.offset || 0) + (auditQuery.limit || 50) < result.total,
          },
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: '查询审计日志失败',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取审计日志详情
   * Get audit log details
   */
  @Get('logs/:id')
  async getAuditLog(@Param('id') id: string) {
    try {
      const result = await this.auditLogService.queryLogs({
        limit: 1,
        offset: 0,
      });

      const log = result.logs.find(log => log.id === id);

      if (!log) {
        throw new HttpException(
          {
            status: 'error',
            message: '审计日志不存在',
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        status: 'success',
        data: { log },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          status: 'error',
          message: '获取审计日志详情失败',
          error: error instanceof Error ? error.message : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取审计统计信息
   * Get audit statistics
   */
  @Get('stats')
  async getAuditStats(
    @Query() query: {
      startDate?: string;
      endDate?: string;
    }
  ) {
    try {
      const startDate = query.startDate ? new Date(query.startDate) : undefined;
      const endDate = query.endDate ? new Date(query.endDate) : undefined;

      const stats = await this.auditLogService.getAuditStats(startDate, endDate);

      return {
        status: 'success',
        data: { stats },
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: '获取审计统计信息失败',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 导出审计日志
   * Export audit logs
   */
  @Post('export')
  async exportAuditLogs(
    @Body() body: {
      query?: AuditLogQuery;
      format?: 'json' | 'csv';
    }
  ) {
    try {
      const format = body.format || 'json';
      const query = body.query || {};

      const exportedData = await this.auditLogService.exportLogs(query, format);

      return {
        status: 'success',
        data: {
          format,
          content: exportedData,
          filename: `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: '导出审计日志失败',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 删除旧的审计日志
   * Delete old audit logs
   */
  @Delete('cleanup')
  async cleanupOldLogs(
    @Body() body: {
      daysToKeep?: number;
    }
  ) {
    try {
      const daysToKeep = body.daysToKeep || 90;

      if (daysToKeep < 30) {
        throw new HttpException(
          {
            status: 'error',
            message: '保留天数不能少于30天',
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const deletedCount = await this.auditLogService.deleteOldLogs(daysToKeep);

      return {
        status: 'success',
        data: {
          deletedCount,
          message: `成功删除 ${deletedCount} 条 ${daysToKeep} 天前的审计日志`,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          status: 'error',
          message: '清理审计日志失败',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取事件类型枚举
   * Get event type enum
   */
  @Get('enums/event-types')
  getEventTypes() {
    return {
      status: 'success',
      data: {
        eventTypes: Object.values(AuditEventType),
      },
    };
  }

  /**
   * 获取严重程度枚举
   * Get severity enum
   */
  @Get('enums/severities')
  getSeverities() {
    return {
      status: 'success',
      data: {
        severities: Object.values(AuditSeverity),
      },
    };
  }

  /**
   * 获取状态枚举
   * Get status enum
   */
  @Get('enums/statuses')
  getStatuses() {
    return {
      status: 'success',
      data: {
        statuses: Object.values(AuditStatus),
      },
    };
  }
}
