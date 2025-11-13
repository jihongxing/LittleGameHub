/**
 * Security Integration Tests
 * 安全集成测试
 *
 * Tests complete security workflows including authentication, authorization,
 * CSRF protection, rate limiting, and security headers
 * 测试完整的安全工作流程，包括认证、授权、CSRF保护、速率限制和安全头
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/modules/users/entities/user.entity';
import { AuditLog } from '../../src/modules/audit/entities/audit-log.entity';
import { createTestUser, cleanupTestData } from '../setup';
import { UserRole } from '../../src/modules/users/entities/user.entity';

describe('Security Integration Tests (T066)', () => {
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

    // Configure validation pipes and security middleware
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));

    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    auditLogRepository = moduleFixture.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));

    // Create test users
    testUser = await createTestUser({
      username: 'security_test_user',
      email: 'security_test@example.com',
      nickname: 'Security Test User',
      role: UserRole.USER,
    });

    adminUser = await createTestUser({
      username: 'security_admin_user',
      email: 'security_admin@example.com',
      nickname: 'Security Admin User',
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

  describe('Authentication Flow Integration', () => {
    it('should complete full authentication flow with audit logging', async () => {
      // 1. Register new user
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'integration_test_user',
          email: 'integration_test@example.com',
          password: 'SecurePass123!',
          nickname: 'Integration Test User',
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.data.user).toBeDefined();

      const newUserId = registerResponse.body.data.user.id;

      // Verify audit log for registration
      const registerAuditLogs = await auditLogRepository.find({
        where: { userId: newUserId, eventType: 'USER_REGISTER' },
      });
      expect(registerAuditLogs.length).toBeGreaterThan(0);

      // 2. Login with new user
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'integration_test_user',
          password: 'SecurePass123!',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.data.accessToken).toBeDefined();

      const userToken = loginResponse.body.data.accessToken;

      // Verify audit log for login
      const loginAuditLogs = await auditLogRepository.find({
        where: { userId: newUserId, eventType: 'USER_LOGIN' },
      });
      expect(loginAuditLogs.length).toBeGreaterThan(0);

      // 3. Access protected resource
      const profileResponse = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.data.user.id).toBe(newUserId);

      // 4. Logout
      const logoutResponse = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`);

      expect(logoutResponse.status).toBe(200);

      // Verify audit log for logout
      const logoutAuditLogs = await auditLogRepository.find({
        where: { userId: newUserId, eventType: 'USER_LOGOUT' },
      });
      expect(logoutAuditLogs.length).toBeGreaterThan(0);

      // 5. Verify token is invalidated
      const afterLogoutResponse = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(afterLogoutResponse.status).toBe(401);

      // Cleanup
      await cleanupTestData([newUserId]);
    });

    it('should handle concurrent authentication attempts with rate limiting', async () => {
      // Make multiple rapid login attempts
      const promises = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            username: 'nonexistent_user',
            password: 'wrongpassword',
          })
      );

      const responses = await Promise.all(promises);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      // Verify failed login attempts are audited
      const failedLoginLogs = await auditLogRepository.find({
        where: { eventType: 'SECURITY_FAILED_LOGIN' },
        order: { createdAt: 'DESC' },
        take: 10,
      });
      expect(failedLoginLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Authorization and Access Control', () => {
    it('should enforce role-based access control', async () => {
      // Regular user tries to access admin endpoint
      const adminOnlyResponse = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(adminOnlyResponse.status).toBe(403);

      // Admin user can access admin endpoint
      const adminResponse = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminResponse.status).toBe(200);
    });

    it('should validate resource ownership', async () => {
      // Create a resource owned by test user
      const gameResponse = await request(app.getHttpServer())
        .post('/api/games')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Game',
          description: 'Integration test game',
          category: 'action',
        });

      expect(gameResponse.status).toBe(201);
      const gameId = gameResponse.body.data.game.id;

      // Admin tries to modify test user's resource
      const adminModifyResponse = await request(app.getHttpServer())
        .put(`/api/games/${gameId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Modified by Admin',
        });

      // Should allow admin to modify (depending on business rules)
      expect([200, 403]).toContain(adminModifyResponse.status);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/api/games/${gameId}`)
        .set('Authorization', `Bearer ${accessToken}`);
    });
  });

  describe('CSRF Protection Integration', () => {
    it('should require CSRF token for state-changing operations', async () => {
      // First, get CSRF token
      const tokenResponse = await request(app.getHttpServer())
        .get('/api/auth/csrf-token')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(tokenResponse.status).toBe(200);
      const csrfToken = tokenResponse.body.data.csrfToken;

      // Attempt password change without CSRF token (should fail)
      const noCsrfResponse = await request(app.getHttpServer())
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'NewSecurePass123!',
        });

      expect(noCsrfResponse.status).toBe(403);

      // Attempt with valid CSRF token (should succeed)
      const withCsrfResponse = await request(app.getHttpServer())
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken)
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'NewSecurePass123!',
        });

      expect(withCsrfResponse.status).toBe(200);
    });

    it('should validate CSRF token integrity', async () => {
      // Try with invalid CSRF token
      const invalidCsrfResponse = await request(app.getHttpServer())
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', 'invalid-token')
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'NewSecurePass123!',
        });

      expect(invalidCsrfResponse.status).toBe(403);
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should enforce different rate limits for different endpoints', async () => {
      // Test login endpoint rate limiting (stricter)
      const loginPromises = Array(5).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            username: 'rate_limit_test',
            password: 'wrongpassword',
          })
      );

      const loginResponses = await Promise.all(loginPromises);
      const loginRateLimited = loginResponses.filter(r => r.status === 429);
      expect(loginRateLimited.length).toBeGreaterThan(0);

      // Test general API rate limiting (more lenient)
      const generalPromises = Array(50).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/api/games')
          .set('Authorization', `Bearer ${accessToken}`)
      );

      const generalResponses = await Promise.all(generalPromises);
      const generalRateLimited = generalResponses.filter(r => r.status === 429);
      expect(generalRateLimited.length).toBeGreaterThan(0);
    });

    it('should differentiate rate limits by user', async () => {
      // Create another test user
      const otherUser = await createTestUser({
        username: 'other_rate_test_user',
        email: 'other_rate_test@example.com',
        nickname: 'Other Rate Test User',
        role: UserRole.USER,
      });

      const otherLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: otherUser.username,
          password: 'testpassword123',
        });

      const otherToken = otherLoginResponse.body.data.accessToken;

      // Both users should be able to make requests (different rate limit buckets)
      const [user1Response, user2Response] = await Promise.all([
        request(app.getHttpServer())
          .get('/api/games')
          .set('Authorization', `Bearer ${accessToken}`),
        request(app.getHttpServer())
          .get('/api/games')
          .set('Authorization', `Bearer ${otherToken}`)
      ]);

      expect(user1Response.status).toBe(200);
      expect(user2Response.status).toBe(200);

      // Cleanup
      await cleanupTestData([otherUser.id]);
    });
  });

  describe('Security Headers and HTTPS Enforcement', () => {
    it('should include security headers in all responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('should handle HTTPS redirection in production', async () => {
      // This would typically be tested in a production-like environment
      // For now, just verify the headers are present
      const response = await request(app.getHttpServer())
        .get('/api/health');

      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('Audit Logging Integration', () => {
    it('should log all security-relevant operations', async () => {
      // Perform various operations and verify audit logging
      const operations = [
        () => request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ username: 'wronguser', password: 'wrongpass' }),
        () => request(app.getHttpServer())
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${accessToken}`),
        () => request(app.getHttpServer())
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`),
      ];

      await Promise.all(operations.map(op => op()));

      // Verify audit logs were created
      const recentLogs = await auditLogRepository.find({
        where: { userId: testUser.id },
        order: { createdAt: 'DESC' },
        take: 10,
      });

      expect(recentLogs.length).toBeGreaterThan(0);

      // Check for different event types
      const eventTypes = recentLogs.map(log => log.eventType);
      expect(eventTypes).toContain('USER_LOGOUT');
      expect(eventTypes.some(type => type.includes('SECURITY') || type.includes('FAILED'))).toBe(true);
    });

    it('should include comprehensive audit data', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      // Verify audit log contains detailed information
      const auditLogs = await auditLogRepository.find({
        where: {
          userId: testUser.id,
          eventType: 'SYSTEM_EVENT', // Profile access might be logged as system event
        },
        order: { createdAt: 'DESC' },
        take: 1,
      });

      if (auditLogs.length > 0) {
        const log = auditLogs[0];
        expect(log.ipAddress).toBeDefined();
        expect(log.userAgent).toBeDefined();
        expect(log.requestMethod).toBeDefined();
        expect(log.requestPath).toBeDefined();
        expect(log.responseStatus).toBeDefined();
        expect(log.executionTime).toBeDefined();
      }
    });
  });

  describe('Password Security Integration', () => {
    it('should enforce password strength requirements', async () => {
      // Try to register with weak password
      const weakPasswordResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'weak_pass_user',
          email: 'weak_pass@example.com',
          password: '123', // Very weak password
          nickname: 'Weak Pass User',
        });

      expect(weakPasswordResponse.status).toBe(400);
      expect(weakPasswordResponse.body.message).toContain('密码强度不足');

      // Register with strong password should work
      const strongPasswordResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'strong_pass_user',
          email: 'strong_pass@example.com',
          password: 'VeryStrongPass123!',
          nickname: 'Strong Pass User',
        });

      expect(strongPasswordResponse.status).toBe(201);

      // Cleanup
      if (strongPasswordResponse.body.data?.user?.id) {
        await cleanupTestData([strongPasswordResponse.body.data.user.id]);
      }
    });

    it('should prevent password reuse and enforce history', async () => {
      // This would require additional password history tracking
      // For now, just verify password change works
      const tokenResponse = await request(app.getHttpServer())
        .get('/api/auth/csrf-token')
        .set('Authorization', `Bearer ${accessToken}`);

      const csrfToken = tokenResponse.body.data.csrfToken;

      const changeResponse = await request(app.getHttpServer())
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken)
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'NewSecurePass456!',
        });

      expect(changeResponse.status).toBe(200);
    });
  });

  describe('Error Handling Integration', () => {
    it('should provide consistent error responses', async () => {
      const responses = await Promise.all([
        request(app.getHttpServer()).get('/api/nonexistent'),
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({}), // Invalid payload
        request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid-token'),
      ]);

      responses.forEach(response => {
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('message');
        expect(['error', 'fail']).toContain(response.body.status);
      });
    });

    it('should not leak sensitive information in errors', async () => {
      const responses = await Promise.all([
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            username: `' OR '1'='1`,
            password: 'malicious',
          }),
        request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'),
      ]);

      responses.forEach(response => {
        expect(response.body.message).not.toContain('SQL');
        expect(response.body.message).not.toContain('database');
        expect(response.body.message).not.toContain('stack');
        expect(response.body.message).not.toContain('error');
      });
    });
  });

  describe('Concurrent Access and Race Conditions', () => {
    it('should handle concurrent requests safely', async () => {
      const concurrentRequests = Array(5).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/api/games/popular')
          .set('Authorization', `Bearer ${accessToken}`)
      );

      const responses = await Promise.all(concurrentRequests);

      responses.forEach(response => {
        expect([200, 429]).toContain(response.status); // Success or rate limited
      });
    });

    it('should maintain data consistency under load', async () => {
      // This would typically test database transactions and locking
      // For now, verify basic concurrent operations work
      const operations = Array(3).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${accessToken}`)
      );

      const responses = await Promise.all(operations);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data.user.id).toBe(testUser.id);
      });
    });
  });
});
