/**
 * Unit tests for AuditLogService
 * 审计日志服务的单元测试
 *
 * Tests audit event logging, querying, and statistics
 * 测试审计事件记录、查询和统计功能
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../src/modules/audit/services/audit-log.service';
import { AuditLog, AuditEventType, AuditSeverity, AuditStatus } from '../../src/modules/audit/entities/audit-log.entity';

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('AuditLogService', () => {
  let service: AuditLogService;
  let mockAuditLogRepository: jest.Mocked<Repository<AuditLog>>;
  let mockDataSource: any;

  const mockAuditLog: AuditLog = {
    id: 'test-uuid',
    userId: 'user-123',
    username: 'testuser',
    eventType: AuditEventType.USER_LOGIN,
    description: 'User login successful',
    severity: AuditSeverity.LOW,
    status: AuditStatus.SUCCESS,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    requestMethod: 'POST',
    requestPath: '/api/auth/login',
    responseStatus: 200,
    executionTime: 150,
    resourceId: 'user-123',
    resourceType: 'user',
    oldValues: null,
    newValues: { lastLogin: new Date() },
    metadata: { device: 'desktop' },
    errorMessage: null,
    sessionId: 'session-123',
    location: { country: 'China', city: 'Beijing' },
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      getRawMany: jest.fn(),
      getCount: jest.fn(),
      clone: jest.fn().mockReturnThis(),
    };

    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      getManyAndCount: jest.fn(),
      getCount: jest.fn(),
    } as any;

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepository,
        },
        {
          provide: 'DataSource',
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    mockAuditLogRepository = module.get(getRepositoryToken(AuditLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Event Logging', () => {
    it('should log user action successfully', async () => {
      mockAuditLogRepository.save.mockResolvedValue(mockAuditLog);

      await service.logUserAction(
        'user-123',
        'testuser',
        AuditEventType.USER_LOGIN,
        'User logged in',
        {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          metadata: { device: 'desktop' },
        }
      );

      expect(mockAuditLogRepository.save).toHaveBeenCalled();
      const savedLog = mockAuditLogRepository.save.mock.calls[0][0];
      expect(savedLog.userId).toBe('user-123');
      expect(savedLog.username).toBe('testuser');
      expect(savedLog.eventType).toBe(AuditEventType.USER_LOGIN);
      expect(savedLog.severity).toBe(AuditSeverity.LOW);
      expect(savedLog.status).toBe(AuditStatus.SUCCESS);
    });

    it('should log admin action with high severity', async () => {
      mockAuditLogRepository.save.mockResolvedValue(mockAuditLog);

      await service.logAdminAction(
        'admin-123',
        'adminuser',
        AuditEventType.ADMIN_USER_MANAGEMENT,
        'Admin updated user profile',
        {
          resourceId: 'user-456',
          resourceType: 'user',
          oldValues: { role: 'user' },
          newValues: { role: 'moderator' },
        }
      );

      expect(mockAuditLogRepository.save).toHaveBeenCalled();
      const savedLog = mockAuditLogRepository.save.mock.calls[0][0];
      expect(savedLog.severity).toBe(AuditSeverity.HIGH);
      expect(savedLog.resourceId).toBe('user-456');
      expect(savedLog.oldValues).toEqual({ role: 'user' });
      expect(savedLog.newValues).toEqual({ role: 'moderator' });
    });

    it('should log security events with appropriate severity', async () => {
      mockAuditLogRepository.save.mockResolvedValue(mockAuditLog);

      await service.logSecurityEvent(
        AuditEventType.SECURITY_FAILED_LOGIN,
        'Failed login attempt',
        {
          ipAddress: '192.168.1.1',
          userId: 'user-123',
          metadata: { attemptCount: 3 },
        }
      );

      expect(mockAuditLogRepository.save).toHaveBeenCalled();
      const savedLog = mockAuditLogRepository.save.mock.calls[0][0];
      expect(savedLog.eventType).toBe(AuditEventType.SECURITY_FAILED_LOGIN);
      expect(savedLog.severity).toBe(AuditSeverity.MEDIUM);
      expect(savedLog.status).toBe(AuditStatus.WARNING);
    });

    it('should log system events with low severity', async () => {
      mockAuditLogRepository.save.mockResolvedValue(mockAuditLog);

      await service.logSystemEvent(
        AuditEventType.SYSTEM_STARTUP,
        'System startup completed',
        {
          metadata: { version: '1.0.0', uptime: 0 },
        }
      );

      expect(mockAuditLogRepository.save).toHaveBeenCalled();
      const savedLog = mockAuditLogRepository.save.mock.calls[0][0];
      expect(savedLog.eventType).toBe(AuditEventType.SYSTEM_STARTUP);
      expect(savedLog.severity).toBe(AuditSeverity.MEDIUM);
      expect(savedLog.userId).toBeNull();
    });

    it('should handle logging errors gracefully', async () => {
      mockAuditLogRepository.save.mockRejectedValue(new Error('Database error'));

      // Should not throw error, just log warning
      await expect(service.logUserAction(
        'user-123',
        'testuser',
        AuditEventType.USER_LOGIN,
        'Test action'
      )).resolves.not.toThrow();
    });
  });

  describe('Event Type Severity Mapping', () => {
    it('should assign correct severity for different event types', async () => {
      const testCases = [
        { eventType: AuditEventType.USER_LOGIN, expectedSeverity: AuditSeverity.LOW },
        { eventType: AuditEventType.USER_REGISTER, expectedSeverity: AuditSeverity.MEDIUM },
        { eventType: AuditEventType.ADMIN_USER_MANAGEMENT, expectedSeverity: AuditSeverity.HIGH },
        { eventType: AuditEventType.ADMIN_SYSTEM_CONFIG, expectedSeverity: AuditSeverity.CRITICAL },
        { eventType: AuditEventType.SECURITY_FAILED_LOGIN, expectedSeverity: AuditSeverity.MEDIUM },
        { eventType: AuditEventType.SYSTEM_ERROR, expectedSeverity: AuditSeverity.HIGH },
      ];

      for (const { eventType, expectedSeverity } of testCases) {
        mockAuditLogRepository.save.mockResolvedValue(mockAuditLog);

        await service.logUserAction('user-123', 'testuser', eventType, 'Test', {});

        const savedLog = mockAuditLogRepository.save.mock.calls[0][0];
        expect(savedLog.severity).toBe(expectedSeverity);
      }
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize sensitive data in oldValues and newValues', async () => {
      mockAuditLogRepository.save.mockResolvedValue(mockAuditLog);

      await service.logUserAction(
        'user-123',
        'testuser',
        AuditEventType.USER_CHANGE_PASSWORD,
        'Password changed',
        {
          oldValues: { password: 'oldsecret123' },
          newValues: { password: 'newsecret456' },
        }
      );

      const savedLog = mockAuditLogRepository.save.mock.calls[0][0];
      expect(savedLog.oldValues).toEqual({ password: '[REDACTED]' });
      expect(savedLog.newValues).toEqual({ password: '[REDACTED]' });
    });

    it('should sanitize token data in metadata', async () => {
      mockAuditLogRepository.save.mockResolvedValue(mockAuditLog);

      await service.logUserAction(
        'user-123',
        'testuser',
        AuditEventType.USER_LOGIN,
        'User logged in',
        {
          metadata: { token: 'jwt.secret.token', refreshToken: 'refresh.secret' },
        }
      );

      const savedLog = mockAuditLogRepository.save.mock.calls[0][0];
      expect(savedLog.metadata).toEqual({
        token: '[REDACTED]',
        refreshToken: '[REDACTED]',
      });
    });

    it('should sanitize long user agent strings', async () => {
      const longUserAgent = 'A'.repeat(600); // Longer than 500 chars
      mockAuditLogRepository.save.mockResolvedValue(mockAuditLog);

      await service.logUserAction(
        'user-123',
        'testuser',
        AuditEventType.USER_LOGIN,
        'User logged in',
        { userAgent: longUserAgent }
      );

      const savedLog = mockAuditLogRepository.save.mock.calls[0][0];
      expect(savedLog.userAgent).toHaveLength(503); // 500 + '...'
      expect(savedLog.userAgent?.endsWith('...')).toBe(true);
    });
  });

  describe('Log Querying', () => {
    it('should query logs with basic filters', async () => {
      const mockLogs = [mockAuditLog];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockLogs, 1]),
        getRawMany: jest.fn(),
        getCount: jest.fn(),
        clone: jest.fn().mockReturnThis(),
      };

      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.queryLogs({
        userId: 'user-123',
        eventType: AuditEventType.USER_LOGIN,
        limit: 10,
        offset: 0,
      });

      expect(result.logs).toEqual(mockLogs);
      expect(result.total).toBe(1);
      expect(mockAuditLogRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('should query logs with date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockLogs = [mockAuditLog];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockLogs, 1]),
        getRawMany: jest.fn(),
        getCount: jest.fn(),
        clone: jest.fn().mockReturnThis(),
      };

      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.queryLogs({
        startDate,
        endDate,
        limit: 50,
      });

      expect(result.logs).toEqual(mockLogs);
      expect(mockAuditLogRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('should query logs with severity filter', async () => {
      const mockLogs = [mockAuditLog];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockLogs, 1]),
        getRawMany: jest.fn(),
        getCount: jest.fn(),
        clone: jest.fn().mockReturnThis(),
      };

      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.queryLogs({
        severity: AuditSeverity.HIGH,
        limit: 20,
      });

      expect(result.logs).toEqual(mockLogs);
      expect(mockAuditLogRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('should handle query errors', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockRejectedValue(new Error('Query failed')),
        getRawMany: jest.fn(),
        getCount: jest.fn(),
        clone: jest.fn().mockReturnThis(),
      };

      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await expect(service.queryLogs({}))
        .rejects
        .toThrow('查询审计日志失败');
    });
  });

  describe('Statistics and Analytics', () => {
    it('should get audit statistics', async () => {
      // Mock event type breakdown
      const eventTypeQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { eventType: 'USER_LOGIN', count: '10' },
          { eventType: 'USER_LOGOUT', count: '8' },
        ]),
      };

      const severityQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { severity: 'LOW', count: '15' },
          { severity: 'MEDIUM', count: '3' },
        ]),
      };

      const statusQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { status: 'SUCCESS', count: '16' },
          { status: 'FAILURE', count: '2' },
        ]),
      };

      const countQueryBuilder = {
        count: jest.fn().mockResolvedValueOnce(5).mockResolvedValueOnce(15).mockResolvedValueOnce(50),
      };

      const topUsersQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { userId: 'user-1', username: 'user1', logCount: '5' },
          { userId: 'user-2', username: 'user2', logCount: '3' },
        ]),
      };

      const topIPsQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { ipAddress: '192.168.1.1', logCount: '8' },
          { ipAddress: '192.168.1.2', logCount: '4' },
        ]),
      };

      mockAuditLogRepository.createQueryBuilder
        .mockReturnValueOnce(eventTypeQueryBuilder as any)
        .mockReturnValueOnce(severityQueryBuilder as any)
        .mockReturnValueOnce(statusQueryBuilder as any)
        .mockReturnValueOnce(countQueryBuilder as any)
        .mockReturnValueOnce(topUsersQueryBuilder as any)
        .mockReturnValueOnce(topIPsQueryBuilder as any);

      (mockAuditLogRepository as any).getCount.mockResolvedValue(18);

      const stats = await service.getAuditStats();

      expect(stats.totalLogs).toBe(18);
      expect(stats.eventTypeBreakdown).toEqual({
        USER_LOGIN: 10,
        USER_LOGOUT: 8,
      });
      expect(stats.severityBreakdown).toEqual({
        LOW: 15,
        MEDIUM: 3,
        HIGH: 0,
        CRITICAL: 0,
      });
      expect(stats.statusBreakdown).toEqual({
        SUCCESS: 16,
        FAILURE: 2,
        WARNING: 0,
      });
      expect(stats.recentActivity).toEqual({
        hour: 5,
        day: 15,
        week: 50,
      });
      expect(stats.topUsers).toHaveLength(2);
      expect(stats.topIPs).toHaveLength(2);
    });

    it('should get statistics with date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };

      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      (mockAuditLogRepository as any).getCount.mockResolvedValue(5);

      const stats = await service.getAuditStats(startDate, endDate);

      expect(stats.totalLogs).toBe(5);
    });

    it('should handle statistics query errors', async () => {
      mockAuditLogRepository.createQueryBuilder.mockImplementation(() => {
        throw new Error('Query failed');
      });

      await expect(service.getAuditStats())
        .rejects
        .toThrow('获取审计统计信息失败');
    });
  });

  describe('Log Export', () => {
    it('should export logs as JSON', async () => {
      const mockLogs = [mockAuditLog];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockLogs, 1]),
        getRawMany: jest.fn(),
        getCount: jest.fn(),
        clone: jest.fn().mockReturnThis(),
      };

      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.exportLogs({ limit: 100 });

      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
    });

    it('should export logs as CSV', async () => {
      const mockLogs = [mockAuditLog];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockLogs, 1]),
        getRawMany: jest.fn(),
        getCount: jest.fn(),
        clone: jest.fn().mockReturnThis(),
      };

      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.exportLogs({ limit: 100 }, 'csv');

      expect(typeof result).toBe('string');
      expect(result).toContain('ID,User ID,Username,Event Type');
    });

    it('should limit export to 10000 records', async () => {
      const mockLogs = Array(15000).fill(mockAuditLog);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockLogs, 15000]),
        getRawMany: jest.fn(),
        getCount: jest.fn(),
        clone: jest.fn().mockReturnThis(),
      };

      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.exportLogs({}, 'json');

      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(10000);
    });
  });

  describe('Log Cleanup', () => {
    it('should delete old logs', async () => {
      mockAuditLogRepository.delete.mockResolvedValue({ affected: 150 } as any);

      const deletedCount = await service.deleteOldLogs(90);

      expect(deletedCount).toBe(150);
      expect(mockAuditLogRepository.delete).toHaveBeenCalled();
    });

    it('should handle cleanup errors', async () => {
      mockAuditLogRepository.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteOldLogs(90))
        .rejects
        .toThrow('删除旧审计日志失败');
    });
  });
});
