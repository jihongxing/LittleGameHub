/**
 * 审计日志服务
 * Audit Log Service
 *
 * 提供审计日志的记录、查询和管理功能
 * Provides audit log recording, querying, and management functionality
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AuditLog, AuditEventType, AuditSeverity, AuditStatus, AuditLogQuery, AuditLogStats } from '../entities/audit-log.entity';
import { logger } from '../../../utils/logger';
import { DatabaseError } from '../../../middleware/errorHandler';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>
  ) {}

  /**
   * 记录审计事件
   * Record audit event
   */
  async logEvent(
    eventType: AuditEventType,
    description: string,
    options: {
      userId?: string;
      username?: string;
      severity?: AuditSeverity;
      status?: AuditStatus;
      ipAddress?: string;
      userAgent?: string;
      requestMethod?: string;
      requestPath?: string;
      responseStatus?: number;
      executionTime?: number;
      resourceId?: string;
      resourceType?: string;
      oldValues?: any;
      newValues?: any;
      metadata?: any;
      errorMessage?: string;
      sessionId?: string;
      location?: any;
    } = {}
  ): Promise<void> {
    try {
      // 敏感数据脱敏处理
      const sanitizedOptions = this.sanitizeAuditData(options);

      const auditLog = this.auditLogRepository.create({
        userId: sanitizedOptions.userId || null,
        username: sanitizedOptions.username || null,
        eventType,
        description: this.sanitizeDescription(description),
        severity: sanitizedOptions.severity || AuditSeverity.LOW,
        status: sanitizedOptions.status || AuditStatus.SUCCESS,
        ipAddress: sanitizedOptions.ipAddress || null,
        userAgent: sanitizedOptions.userAgent || null,
        requestMethod: sanitizedOptions.requestMethod || null,
        requestPath: sanitizedOptions.requestPath || null,
        responseStatus: sanitizedOptions.responseStatus || null,
        executionTime: sanitizedOptions.executionTime || null,
        resourceId: sanitizedOptions.resourceId || null,
        resourceType: sanitizedOptions.resourceType || null,
        oldValues: sanitizedOptions.oldValues || null,
        newValues: sanitizedOptions.newValues || null,
        metadata: sanitizedOptions.metadata || null,
        errorMessage: sanitizedOptions.errorMessage || null,
        sessionId: sanitizedOptions.sessionId || null,
        location: sanitizedOptions.location || null,
      });

      await this.auditLogRepository.save(auditLog);

      // 记录高严重程度的事件到系统日志
      if (auditLog.severity === AuditSeverity.CRITICAL ||
          auditLog.severity === AuditSeverity.HIGH) {
        logger.warn(`AUDIT EVENT [${auditLog.severity}]: ${auditLog.description}`, {
          auditLogId: auditLog.id,
          userId: auditLog.userId,
          eventType: auditLog.eventType,
          ipAddress: auditLog.ipAddress,
        });
      }

    } catch (error) {
      logger.error('Failed to log audit event:', error as Error);
      // 审计日志失败不应该影响主要业务流程
      // 但在生产环境中应该有告警机制
    }
  }

  /**
   * 记录用户操作
   * Log user action
   */
  async logUserAction(
    userId: string,
    username: string,
    eventType: AuditEventType,
    description: string,
    options: {
      ipAddress?: string;
      userAgent?: string;
      resourceId?: string;
      resourceType?: string;
      oldValues?: any;
      newValues?: any;
      metadata?: any;
      status?: AuditStatus;
      executionTime?: number;
    } = {}
  ): Promise<void> {
    await this.logEvent(eventType, description, {
      userId,
      username,
      severity: this.getEventSeverity(eventType),
      ...options,
    });
  }

  /**
   * 记录管理员操作
   * Log admin action
   */
  async logAdminAction(
    adminId: string,
    adminUsername: string,
    eventType: AuditEventType,
    description: string,
    options: {
      ipAddress?: string;
      userAgent?: string;
      resourceId?: string;
      resourceType?: string;
      oldValues?: any;
      newValues?: any;
      metadata?: any;
      status?: AuditStatus;
      executionTime?: number;
    } = {}
  ): Promise<void> {
    await this.logEvent(eventType, description, {
      userId: adminId,
      username: adminUsername,
      severity: AuditSeverity.HIGH, // 管理员操作默认为高严重程度
      ...options,
    });
  }

  /**
   * 记录安全事件
   * Log security event
   */
  async logSecurityEvent(
    eventType: AuditEventType,
    description: string,
    options: {
      userId?: string;
      username?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: any;
      severity?: AuditSeverity;
    } = {}
  ): Promise<void> {
    await this.logEvent(eventType, description, {
      severity: options.severity || AuditSeverity.HIGH,
      status: AuditStatus.WARNING,
      ...options,
    });
  }

  /**
   * 记录系统事件
   * Log system event
   */
  async logSystemEvent(
    eventType: AuditEventType,
    description: string,
    options: {
      metadata?: any;
      severity?: AuditSeverity;
      status?: AuditStatus;
    } = {}
  ): Promise<void> {
    await this.logEvent(eventType, description, {
      severity: options.severity || AuditSeverity.MEDIUM,
      ...options,
    });
  }

  /**
   * 查询审计日志
   * Query audit logs
   */
  async queryLogs(query: AuditLogQuery): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      const queryBuilder = this.buildQuery(query);

      const [logs, total] = await queryBuilder.getManyAndCount();

      return { logs, total };
    } catch (error) {
      logger.error('Failed to query audit logs:', error as Error);
      throw new DatabaseError(`查询审计日志失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取审计统计信息
   * Get audit statistics
   */
  async getAuditStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditLogStats> {
    try {
      const queryBuilder = this.auditLogRepository.createQueryBuilder('log');

      if (startDate) {
        queryBuilder.andWhere('log.createdAt >= :startDate', { startDate });
      }

      if (endDate) {
        queryBuilder.andWhere('log.createdAt <= :endDate', { endDate });
      }

      // 总日志数
      const totalLogs = await queryBuilder.getCount();

      // 事件类型分布
      const eventTypeBreakdown = await this.getEventTypeBreakdown(queryBuilder.clone());
      const severityBreakdown = await this.getSeverityBreakdown(queryBuilder.clone());
      const statusBreakdown = await this.getStatusBreakdown(queryBuilder.clone());

      // 近期活动
      const recentActivity = await this.getRecentActivity();

      // 活跃用户
      const topUsers = await this.getTopUsers(queryBuilder.clone());

      // 活跃IP
      const topIPs = await this.getTopIPs(queryBuilder.clone());

      return {
        totalLogs,
        eventTypeBreakdown,
        severityBreakdown,
        statusBreakdown,
        recentActivity,
        topUsers,
        topIPs,
      };
    } catch (error) {
      logger.error('Failed to get audit stats:', error as Error);
      throw new DatabaseError(`获取审计统计信息失败: ${(error as Error).message}`);
    }
  }

  /**
   * 删除旧的审计日志
   * Delete old audit logs
   */
  async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.auditLogRepository.delete({
        createdAt: {
          $lt: cutoffDate,
        } as any,
      });

      logger.info(`Deleted ${result.affected || 0} old audit logs older than ${daysToKeep} days`);

      return result.affected || 0;
    } catch (error) {
      logger.error('Failed to delete old audit logs:', error as Error);
      throw new DatabaseError(`删除旧审计日志失败: ${(error as Error).message}`);
    }
  }

  /**
   * 导出审计日志
   * Export audit logs
   */
  async exportLogs(query: AuditLogQuery, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const { logs } = await this.queryLogs({ ...query, limit: 10000 }); // 限制导出数量

      if (format === 'csv') {
        return this.convertToCSV(logs);
      } else {
        return JSON.stringify(logs, null, 2);
      }
    } catch (error) {
      logger.error('Failed to export audit logs:', error as Error);
      throw new DatabaseError(`导出审计日志失败: ${(error as Error).message}`);
    }
  }

  /**
   * 构建查询
   * Build query
   */
  private buildQuery(query: AuditLogQuery): SelectQueryBuilder<AuditLog> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('log');

    if (query.userId) {
      queryBuilder.andWhere('log.userId = :userId', { userId: query.userId });
    }

    if (query.eventType) {
      queryBuilder.andWhere('log.eventType = :eventType', { eventType: query.eventType });
    }

    if (query.severity) {
      queryBuilder.andWhere('log.severity = :severity', { severity: query.severity });
    }

    if (query.status) {
      queryBuilder.andWhere('log.status = :status', { status: query.status });
    }

    if (query.ipAddress) {
      queryBuilder.andWhere('log.ipAddress = :ipAddress', { ipAddress: query.ipAddress });
    }

    if (query.resourceType) {
      queryBuilder.andWhere('log.resourceType = :resourceType', { resourceType: query.resourceType });
    }

    if (query.resourceId) {
      queryBuilder.andWhere('log.resourceId = :resourceId', { resourceId: query.resourceId });
    }

    if (query.startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', { endDate: query.endDate });
    }

    // 默认排序：最新优先
    queryBuilder.orderBy('log.createdAt', 'DESC');

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    return queryBuilder;
  }

  /**
   * 敏感数据脱敏处理
   * Sanitize sensitive audit data
   */
  private sanitizeAuditData(data: any): any {
    const sanitized = { ...data };

    // 脱敏密码相关字段
    if (sanitized.oldValues?.password) {
      sanitized.oldValues.password = '[REDACTED]';
    }
    if (sanitized.newValues?.password) {
      sanitized.newValues.password = '[REDACTED]';
    }

    // 脱敏令牌相关字段
    if (sanitized.metadata?.token) {
      sanitized.metadata.token = '[REDACTED]';
    }

    // 限制用户代理长度
    if (sanitized.userAgent && sanitized.userAgent.length > 500) {
      sanitized.userAgent = sanitized.userAgent.substring(0, 500) + '...';
    }

    return sanitized;
  }

  /**
   * 清理描述文本
   * Sanitize description text
   */
  private sanitizeDescription(description: string): string {
    // 移除或替换敏感信息
    return description.replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[CARD_NUMBER]');
  }

  /**
   * 获取事件严重程度
   * Get event severity
   */
  private getEventSeverity(eventType: AuditEventType): AuditSeverity {
    const severityMap: Record<AuditEventType, AuditSeverity> = {
      [AuditEventType.USER_LOGIN]: AuditSeverity.LOW,
      [AuditEventType.USER_LOGOUT]: AuditSeverity.LOW,
      [AuditEventType.USER_REGISTER]: AuditSeverity.MEDIUM,
      [AuditEventType.USER_UPDATE_PROFILE]: AuditSeverity.LOW,
      [AuditEventType.USER_CHANGE_PASSWORD]: AuditSeverity.MEDIUM,
      [AuditEventType.USER_DELETE_ACCOUNT]: AuditSeverity.HIGH,

      [AuditEventType.ADMIN_USER_MANAGEMENT]: AuditSeverity.HIGH,
      [AuditEventType.ADMIN_GAME_MANAGEMENT]: AuditSeverity.HIGH,
      [AuditEventType.ADMIN_SYSTEM_CONFIG]: AuditSeverity.CRITICAL,
      [AuditEventType.ADMIN_SECURITY_SETTINGS]: AuditSeverity.CRITICAL,

      [AuditEventType.GAME_PLAY]: AuditSeverity.LOW,
      [AuditEventType.GAME_DOWNLOAD]: AuditSeverity.LOW,
      [AuditEventType.GAME_RATE]: AuditSeverity.LOW,
      [AuditEventType.GAME_FAVORITE]: AuditSeverity.LOW,

      [AuditEventType.POINTS_EARN]: AuditSeverity.LOW,
      [AuditEventType.POINTS_SPEND]: AuditSeverity.LOW,
      [AuditEventType.POINTS_TRANSFER]: AuditSeverity.MEDIUM,
      [AuditEventType.REWARD_CLAIM]: AuditSeverity.LOW,

      [AuditEventType.SECURITY_FAILED_LOGIN]: AuditSeverity.MEDIUM,
      [AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED]: AuditSeverity.MEDIUM,
      [AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY]: AuditSeverity.HIGH,
      [AuditEventType.SECURITY_PASSWORD_RESET]: AuditSeverity.MEDIUM,

      [AuditEventType.SYSTEM_STARTUP]: AuditSeverity.LOW,
      [AuditEventType.SYSTEM_SHUTDOWN]: AuditSeverity.LOW,
      [AuditEventType.SYSTEM_BACKUP]: AuditSeverity.MEDIUM,
      [AuditEventType.SYSTEM_MAINTENANCE]: AuditSeverity.MEDIUM,
      [AuditEventType.SYSTEM_ERROR]: AuditSeverity.HIGH,
    };

    return severityMap[eventType] || AuditSeverity.LOW;
  }

  /**
   * 获取事件类型分布
   */
  private async getEventTypeBreakdown(queryBuilder: SelectQueryBuilder<AuditLog>): Promise<Record<AuditEventType, number>> {
    const result = await queryBuilder
      .select('log.eventType', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.eventType')
      .getRawMany();

    const breakdown: Record<string, number> = {};
    result.forEach(row => {
      breakdown[row.eventType] = parseInt(row.count, 10);
    });

    return breakdown as Record<AuditEventType, number>;
  }

  /**
   * 获取严重程度分布
   */
  private async getSeverityBreakdown(queryBuilder: SelectQueryBuilder<AuditLog>): Promise<Record<AuditSeverity, number>> {
    const result = await queryBuilder
      .select('log.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.severity')
      .getRawMany();

    const breakdown: Record<string, number> = {};
    Object.values(AuditSeverity).forEach(severity => {
      breakdown[severity] = 0;
    });

    result.forEach(row => {
      breakdown[row.severity] = parseInt(row.count, 10);
    });

    return breakdown as Record<AuditSeverity, number>;
  }

  /**
   * 获取状态分布
   */
  private async getStatusBreakdown(queryBuilder: SelectQueryBuilder<AuditLog>): Promise<Record<AuditStatus, number>> {
    const result = await queryBuilder
      .select('log.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.status')
      .getRawMany();

    const breakdown: Record<string, number> = {};
    Object.values(AuditStatus).forEach(status => {
      breakdown[status] = 0;
    });

    result.forEach(row => {
      breakdown[row.status] = parseInt(row.count, 10);
    });

    return breakdown as Record<AuditStatus, number>;
  }

  /**
   * 获取近期活动统计
   */
  private async getRecentActivity(): Promise<{ hour: number; day: number; week: number }> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [hour, day, week] = await Promise.all([
      this.auditLogRepository.count({ where: { createdAt: { $gte: oneHourAgo } as any } }),
      this.auditLogRepository.count({ where: { createdAt: { $gte: oneDayAgo } as any } }),
      this.auditLogRepository.count({ where: { createdAt: { $gte: oneWeekAgo } as any } }),
    ]);

    return { hour, day, week };
  }

  /**
   * 获取最活跃用户
   */
  private async getTopUsers(queryBuilder: SelectQueryBuilder<AuditLog>): Promise<Array<{ userId: string; username: string | null; logCount: number }>> {
    const result = await queryBuilder
      .select('log.userId', 'userId')
      .addSelect('log.username', 'username')
      .addSelect('COUNT(*)', 'logCount')
      .where('log.userId IS NOT NULL')
      .groupBy('log.userId')
      .addGroupBy('log.username')
      .orderBy('logCount', 'DESC')
      .limit(10)
      .getRawMany();

    return result.map(row => ({
      userId: row.userId,
      username: row.username,
      logCount: parseInt(row.logCount, 10),
    }));
  }

  /**
   * 获取最活跃IP
   */
  private async getTopIPs(queryBuilder: SelectQueryBuilder<AuditLog>): Promise<Array<{ ipAddress: string; logCount: number }>> {
    const result = await queryBuilder
      .select('log.ipAddress', 'ipAddress')
      .addSelect('COUNT(*)', 'logCount')
      .where('log.ipAddress IS NOT NULL')
      .groupBy('log.ipAddress')
      .orderBy('logCount', 'DESC')
      .limit(10)
      .getRawMany();

    return result.map(row => ({
      ipAddress: row.ipAddress,
      logCount: parseInt(row.logCount, 10),
    }));
  }

  /**
   * 转换为CSV格式
   * Convert to CSV format
   */
  private convertToCSV(logs: AuditLog[]): string {
    const headers = [
      'ID', 'User ID', 'Username', 'Event Type', 'Description', 'Severity',
      'Status', 'IP Address', 'Request Method', 'Request Path', 'Response Status',
      'Execution Time', 'Resource Type', 'Resource ID', 'Created At'
    ];

    const rows = logs.map(log => [
      log.id,
      log.userId || '',
      log.username || '',
      log.eventType,
      log.description,
      log.severity,
      log.status,
      log.ipAddress || '',
      log.requestMethod || '',
      log.requestPath || '',
      log.responseStatus || '',
      log.executionTime || '',
      log.resourceType || '',
      log.resourceId || '',
      log.createdAt.toISOString(),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}
