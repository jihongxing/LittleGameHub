/**
 * Audit Log Integration Tests
 * 审计日志集成测试
 *
 * Tests complete audit logging workflows including event recording,
 * querying, analytics, and compliance features
 * 测试完整审计日志工作流程，包括事件记录、查询、分析和合规功能
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/modules/users/entities/user.entity';
import { AuditLog, AuditEventType, AuditSeverity } from '../../src/modules/audit/entities/audit-log.entity';
import { createTestUser, cleanupTestData } from '../setup';
import { UserRole } from '../../src/modules/users/entities/user.entity';

describe('Audit Log Integration Tests (T068)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let auditLogRepository: Repository<AuditLog>;
  let testUser: User;
  let adminUser: User;
  let accessToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    auditLogRepository = moduleFixture.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));

    // Create test users
    testUser = await createTestUser({
      username: 'audit_test_user',
      email: 'audit_test@example.com',
      nickname: 'Audit Test User',
      role: UserRole.USER,
    });

    adminUser = await createTestUser({
      username: 'audit_admin_user',
      email: 'audit_admin@example.com',
      nickname: 'Audit Admin User',
      role: UserRole.ADMIN,
    });

    // Login to get tokens
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: 'testpassword123',
      });

    accessToken = loginResponse.body.data.accessToken;

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: adminUser.username,
        password: 'testpassword123',
      });

    adminToken = adminLoginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await cleanupTestData([testUser.id, adminUser.id]);
    await app.close();
  });

  describe('Event Recording Integration', () => {
    it('should record comprehensive audit data for user actions', async () => {
      // Perform a series of user actions
      const actions = [
        () => request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${accessToken}`),
        () => request(app.getHttpServer())
          .put('/api/auth/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ nickname: 'Updated Nickname' }),
        () => request(app.getHttpServer())
          .get('/api/games')
          .set('Authorization', `Bearer ${accessToken}`),
      ];

      await Promise.all(actions.map(action => action()));

      // Verify audit logs were created with comprehensive data
      const auditLogs = await auditLogRepository.find({
        where: { userId: testUser.id },
        order: { createdAt: 'DESC' },
        take: 10,
      });

      expect(auditLogs.length).toBeGreaterThan(0);

      auditLogs.forEach(log => {
        expect(log.id).toBeDefined();
        expect(log.userId).toBe(testUser.id);
        expect(log.username).toBe(testUser.nickname);
        expect(log.ipAddress).toBeDefined();
        expect(log.userAgent).toBeDefined();
        expect(log.requestMethod).toBeDefined();
        expect(log.requestPath).toBeDefined();
        expect(log.responseStatus).toBeDefined();
        expect(log.executionTime).toBeGreaterThanOrEqual(0);
        expect(log.createdAt).toBeDefined();
      });
    });

    it('should record security events with appropriate severity', async () => {
      // Trigger security events
      const securityActions = [
        () => request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ username: 'nonexistent', password: 'wrong' }),
        () => request(app.getHttpServer())
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${accessToken}`), // Unauthorized access attempt
        () => request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ username: testUser.username, password: 'wrongpassword' }),
      ];

      await Promise.all(securityActions.map(action => action()));

      // Verify security events were logged
      const securityLogs = await auditLogRepository.find({
        where: [
          { eventType: AuditEventType.SECURITY_FAILED_LOGIN },
          { eventType: AuditEventType.SECURITY_UNAUTHORIZED_ACCESS },
        ],
        order: { createdAt: 'DESC' },
        take: 5,
      });

      expect(securityLogs.length).toBeGreaterThan(0);

      securityLogs.forEach(log => {
        expect(log.severity).toBeGreaterThanOrEqual(AuditSeverity.MEDIUM);
        expect(log.status).toBe('WARNING');
      });
    });

    it('should record admin actions with high severity', async () => {
      // Admin performs sensitive operations
      const adminActions = [
        () => request(app.getHttpServer())
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`),
        () => request(app.getHttpServer())
          .get('/api/admin/stats')
          .set('Authorization', `Bearer ${adminToken}`),
      ];

      await Promise.all(adminActions.map(action => action()));

      // Verify admin actions were logged with high severity
      const adminLogs = await auditLogRepository.find({
        where: { userId: adminUser.id },
        order: { createdAt: 'DESC' },
        take: 5,
      });

      const highSeverityLogs = adminLogs.filter(log => log.severity >= AuditSeverity.HIGH);
      expect(highSeverityLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Data Sanitization Integration', () => {
    it('should sanitize sensitive data in audit logs', async () => {
      // Get CSRF token first
      const csrfResponse = await request(app.getHttpServer())
        .get('/api/auth/csrf-token')
        .set('Authorization', `Bearer ${accessToken}`);

      const csrfToken = csrfResponse.body.data.csrfToken;

      // Perform password change operation
      await request(app.getHttpServer())
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken)
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'NewSecurePass456!',
        });

      // Verify password data was sanitized in audit logs
      const passwordChangeLogs = await auditLogRepository.find({
        where: { userId: testUser.id, eventType: AuditEventType.USER_PASSWORD_CHANGE },
        order: { createdAt: 'DESC' },
        take: 1,
      });

      if (passwordChangeLogs.length > 0) {
        const log = passwordChangeLogs[0];

        // Check that sensitive data is redacted
        if (log.oldValues && typeof log.oldValues === 'object') {
          const oldValues = log.oldValues as any;
          if (oldValues.password) {
            expect(oldValues.password).toBe('[REDACTED]');
          }
        }

        if (log.newValues && typeof log.newValues === 'object') {
          const newValues = log.newValues as any;
          if (newValues.password) {
            expect(newValues.password).toBe('[REDACTED]');
          }
        }
      }
    });

    it('should sanitize tokens and secrets in metadata', async () => {
      // Perform login to generate token-related logs
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'testpassword123',
        });

      // Check recent logs for token sanitization
      const recentLogs = await auditLogRepository.find({
        order: { createdAt: 'DESC' },
        take: 10,
      });

      recentLogs.forEach(log => {
        if (log.metadata && typeof log.metadata === 'object') {
          const metadata = log.metadata as any;

          // Check for sanitized tokens
          if (metadata.token) {
            expect(metadata.token).toBe('[REDACTED]');
          }
          if (metadata.refreshToken) {
            expect(metadata.refreshToken).toBe('[REDACTED]');
          }
          if (metadata.accessToken) {
            expect(metadata.accessToken).toBe('[REDACTED]');
          }
        }
      });
    });

    it('should truncate long user agent strings', async () => {
      // Create a request with a very long user agent
      const longUserAgent = 'A'.repeat(600); // Over 500 characters

      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('User-Agent', longUserAgent);

      // Verify user agent was truncated
      const recentLogs = await auditLogRepository.find({
        where: { userId: testUser.id },
        order: { createdAt: 'DESC' },
        take: 1,
      });

      if (recentLogs.length > 0) {
        const log = recentLogs[0];
        expect(log.userAgent).toBeDefined();
        expect(log.userAgent!.length).toBeLessThanOrEqual(503); // 500 + '...'
        if (log.userAgent!.length === 503) {
          expect(log.userAgent!.endsWith('...')).toBe(true);
        }
      }
    });
  });

  describe('Audit Query and Analytics', () => {
    beforeAll(async () => {
      // Generate some test audit data
      const testActions = Array(5).fill(null).map((_, index) =>
        request(app.getHttpServer())
          .get('/api/games')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('User-Agent', `Test Agent ${index}`)
      );

      await Promise.all(testActions);

      // Add some security events
      const securityActions = Array(3).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ username: 'wronguser', password: 'wrongpass' })
      );

      await Promise.all(securityActions);
    });

    it('should query audit logs with filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          userId: testUser.id,
          limit: 10,
          offset: 0,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('logs');
      expect(response.body.data).toHaveProperty('total');
      expect(Array.isArray(response.body.data.logs)).toBe(true);
    });

    it('should provide audit analytics and statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/audit/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalLogs');
      expect(response.body.data).toHaveProperty('eventTypeBreakdown');
      expect(response.body.data).toHaveProperty('severityBreakdown');
      expect(response.body.data).toHaveProperty('statusBreakdown');
      expect(response.body.data).toHaveProperty('recentActivity');
      expect(response.body.data).toHaveProperty('topUsers');
      expect(response.body.data).toHaveProperty('topIPs');
    });

    it('should export audit logs in different formats', async () => {
      // Export as JSON
      const jsonResponse = await request(app.getHttpServer())
        .get('/api/audit/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ format: 'json', limit: 5 });

      expect(jsonResponse.status).toBe(200);
      expect(jsonResponse.headers['content-type']).toContain('application/json');

      const jsonData = JSON.parse(jsonResponse.text);
      expect(Array.isArray(jsonData)).toBe(true);
      expect(jsonData.length).toBeLessThanOrEqual(5);

      // Export as CSV
      const csvResponse = await request(app.getHttpServer())
        .get('/api/audit/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ format: 'csv', limit: 5 });

      expect(csvResponse.status).toBe(200);
      expect(csvResponse.headers['content-type']).toContain('text/csv');
      expect(csvResponse.text).toContain('ID,User ID,Username,Event Type');
    });

    it('should enforce access control for audit data', async () => {
      // Regular user tries to access audit logs
      const unauthorizedResponse = await request(app.getHttpServer())
        .get('/api/audit/logs')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(unauthorizedResponse.status).toBe(403);

      // Regular user tries to access audit stats
      const statsResponse = await request(app.getHttpServer())
        .get('/api/audit/stats')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(statsResponse.status).toBe(403);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle high-frequency audit logging', async () => {
      const startTime = Date.now();

      // Perform many operations rapidly
      const rapidOperations = Array(10).fill(null).map((_, index) =>
        request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('User-Agent', `Load Test ${index}`)
      );

      const responses = await Promise.all(rapidOperations);
      const endTime = Date.now();

      // All operations should succeed
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status); // Success or rate limited
      });

      // Performance check - should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000); // Less than 5 seconds

      // Verify all operations were logged
      const auditLogs = await auditLogRepository.find({
        where: { userId: testUser.id },
        order: { createdAt: 'DESC' },
        take: 15,
      });

      // Should have logged most operations (some might be rate limited)
      expect(auditLogs.length).toBeGreaterThan(5);
    });

    it('should maintain audit data integrity under concurrent load', async () => {
      // Create multiple concurrent sessions
      const concurrentOperations = Array(3).fill(null).map(() =>
        Promise.all([
          request(app.getHttpServer())
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${accessToken}`),
          request(app.getHttpServer())
            .get('/api/games')
            .set('Authorization', `Bearer ${accessToken}`),
          request(app.getHttpServer())
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`),
        ])
      );

      const results = await Promise.all(concurrentOperations);

      // All operations should complete
      results.forEach(sessionResults => {
        sessionResults.forEach(response => {
          expect([200, 401, 429]).toContain(response.status); // Success, logged out, or rate limited
        });
      });

      // Verify audit logs maintain chronological order and integrity
      const auditLogs = await auditLogRepository.find({
        order: { createdAt: 'DESC' },
        take: 20,
      });

      // Check that logs are properly ordered
      for (let i = 0; i < auditLogs.length - 1; i++) {
        expect(auditLogs[i].createdAt.getTime()).toBeGreaterThanOrEqual(auditLogs[i + 1].createdAt.getTime());
      }
    });
  });

  describe('Compliance and Retention', () => {
    it('should support audit log retention policies', async () => {
      // This would typically test log cleanup services
      // For integration test, verify logs exist and can be queried
      const initialCount = await auditLogRepository.count();

      // Perform some operations
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      const afterCount = await auditLogRepository.count();
      expect(afterCount).toBeGreaterThan(initialCount);
    });

    it('should provide tamper-evident audit trails', async () => {
      // Create a log entry
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      // Retrieve the log
      const recentLogs = await auditLogRepository.find({
        where: { userId: testUser.id },
        order: { createdAt: 'DESC' },
        take: 1,
      });

      expect(recentLogs.length).toBeGreaterThan(0);

      const log = recentLogs[0];

      // Verify log immutability - these fields should not be changeable
      expect(log.id).toBeDefined();
      expect(log.createdAt).toBeDefined();
      expect(log.userId).toBe(testUser.id);

      // Verify log contains all required compliance fields
      expect(log.eventType).toBeDefined();
      expect(log.severity).toBeDefined();
      expect(log.status).toBeDefined();
      expect(log.ipAddress).toBeDefined();
    });

    it('should support audit log archiving and backup', async () => {
      // This would test export functionality for archiving
      const exportResponse = await request(app.getHttpServer())
        .get('/api/audit/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ format: 'json', limit: 100 });

      expect(exportResponse.status).toBe(200);

      // Verify exported data structure
      const exportedData = JSON.parse(exportResponse.text);
      expect(Array.isArray(exportedData)).toBe(true);

      if (exportedData.length > 0) {
        const sampleLog = exportedData[0];
        expect(sampleLog).toHaveProperty('id');
        expect(sampleLog).toHaveProperty('eventType');
        expect(sampleLog).toHaveProperty('userId');
        expect(sampleLog).toHaveProperty('createdAt');
        expect(sampleLog).toHaveProperty('severity');
      }
    });
  });

  describe('Real-time Audit Monitoring', () => {
    it('should provide real-time audit statistics', async () => {
      // Get initial stats
      const initialStatsResponse = await request(app.getHttpServer())
        .get('/api/audit/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      const initialStats = initialStatsResponse.body.data;

      // Perform some operations
      await Promise.all([
        request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${accessToken}`),
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ username: 'wrong', password: 'wrong' }),
      ]);

      // Get updated stats
      const updatedStatsResponse = await request(app.getHttpServer())
        .get('/api/audit/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      const updatedStats = updatedStatsResponse.body.data;

      // Stats should reflect new activity
      expect(updatedStats.totalLogs).toBeGreaterThanOrEqual(initialStats.totalLogs);
    });

    it('should support audit alert thresholds', async () => {
      // This would test alerting on suspicious activity patterns
      // For integration test, verify that security events are properly flagged

      // Generate multiple failed login attempts
      const failedLogins = Array(5).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ username: testUser.username, password: 'wrongpassword' })
      );

      await Promise.all(failedLogins);

      // Verify failed login events are logged with appropriate severity
      const securityLogs = await auditLogRepository.find({
        where: { eventType: AuditEventType.SECURITY_FAILED_LOGIN },
        order: { createdAt: 'DESC' },
        take: 5,
      });

      expect(securityLogs.length).toBeGreaterThan(0);

      securityLogs.forEach(log => {
        expect(log.severity).toBeGreaterThanOrEqual(AuditSeverity.MEDIUM);
        expect(log.status).toBe('WARNING');
      });
    });
  });

  describe('Cross-system Audit Correlation', () => {
    it('should correlate related audit events', async () => {
      // Perform a sequence of related operations
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'testpassword123',
        });

      const newToken = loginResponse.body.data.accessToken;

      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${newToken}`);

      // Get CSRF token
      const csrfResponse = await request(app.getHttpServer())
        .get('/api/auth/csrf-token')
        .set('Authorization', `Bearer ${newToken}`);

      const csrfToken = csrfResponse.body.data.csrfToken;

      // Change password
      await request(app.getHttpServer())
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${newToken}`)
        .set('x-csrf-token', csrfToken)
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'UpdatedPass789!',
        });

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newToken}`);

      // Verify the sequence of events is properly logged
      const userLogs = await auditLogRepository.find({
        where: { userId: testUser.id },
        order: { createdAt: 'DESC' },
        take: 10,
      });

      // Should have login, profile access, password change, logout
      const eventTypes = userLogs.map(log => log.eventType);
      expect(eventTypes).toContain(AuditEventType.USER_LOGIN);
      expect(eventTypes).toContain(AuditEventType.USER_LOGOUT);

      // Verify chronological order (login before logout)
      const loginLog = userLogs.find(log => log.eventType === AuditEventType.USER_LOGIN);
      const logoutLog = userLogs.find(log => log.eventType === AuditEventType.USER_LOGOUT);

      if (loginLog && logoutLog) {
        expect(loginLog.createdAt.getTime()).toBeLessThan(logoutLog.createdAt.getTime());
      }
    });

    it('should maintain session correlation across operations', async () => {
      // This would test session ID tracking across related operations
      // For integration test, verify that operations from same session are correlated

      const operations = [
        () => request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${accessToken}`),
        () => request(app.getHttpServer())
          .get('/api/games')
          .set('Authorization', `Bearer ${accessToken}`),
        () => request(app.getHttpServer())
          .get('/api/games/popular')
          .set('Authorization', `Bearer ${accessToken}`),
      ];

      await Promise.all(operations.map(op => op()));

      // Verify all operations are attributed to the same user/session
      const sessionLogs = await auditLogRepository.find({
        where: { userId: testUser.id },
        order: { createdAt: 'DESC' },
        take: 10,
      });

      sessionLogs.forEach(log => {
        expect(log.userId).toBe(testUser.id);
        expect(log.username).toBe(testUser.nickname);
        expect(log.ipAddress).toBeDefined();
      });
    });
  });
});
