/**
 * End-to-End Integration Tests
 * 端到端集成测试
 *
 * Tests complete user journeys from registration to complex interactions,
 * ensuring all security, business logic, and integration points work together
 * 测试完整用户旅程，从注册到复杂交互，确保所有安全、业务逻辑和集成点协同工作
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import * as fs from 'fs-extra';
import * as path from 'path';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/modules/users/entities/user.entity';
import { AuditLog, AuditEventType } from '../../src/modules/audit/entities/audit-log.entity';
import { createTestUser, cleanupTestData } from '../setup';

describe('End-to-End Integration Tests (T069)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let auditLogRepository: Repository<AuditLog>;
  let testUser: any;
  let journeyUserId: string;

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

    // Create a test user for various operations
    testUser = await createTestUser({
      username: 'e2e_test_user',
      email: 'e2e_test@example.com',
      nickname: 'E2E Test User',
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (journeyUserId) {
      await cleanupTestData([journeyUserId]);
    }
    await cleanupTestData([testUser.id]);
    await app.close();

    // Clean up test files
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (await fs.pathExists(uploadDir)) {
      await fs.remove(uploadDir);
    }
  });

  describe('Complete User Registration Journey', () => {
    it('should guide user through complete registration and onboarding', async () => {
      // Step 1: User Registration
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'journey_user',
          email: 'journey@example.com',
          password: 'SecureJourney123!',
          nickname: 'Journey User',
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.data.user).toBeDefined();
      journeyUserId = registerResponse.body.data.user.id;

      // Verify registration audit log
      const registerLogs = await auditLogRepository.find({
        where: { userId: journeyUserId, eventType: AuditEventType.USER_REGISTER },
      });
      expect(registerLogs.length).toBe(1);

      // Step 2: User Login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'journey_user',
          password: 'SecureJourney123!',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.data.accessToken).toBeDefined();
      const accessToken = loginResponse.body.data.accessToken;

      // Step 3: Profile Access and Update
      const profileResponse = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.data.user.username).toBe('journey_user');

      // Update profile
      const updateResponse = await request(app.getHttpServer())
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          nickname: 'Updated Journey User',
          bio: 'I am on a journey of testing!',
        });

      expect(updateResponse.status).toBe(200);

      // Step 4: Avatar Upload
      const avatarBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00,
      ]);

      const avatarResponse = await request(app.getHttpServer())
        .post('/api/upload/single/avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', avatarBuffer, 'profile-avatar.jpg');

      expect(avatarResponse.status).toBe(201);
      const avatarFilename = avatarResponse.body.data.filename;

      // Step 5: Game Discovery and Interaction
      const gamesResponse = await request(app.getHttpServer())
        .get('/api/games')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(gamesResponse.status).toBe(200);

      // Create a game (if admin) or just browse
      const gameCreationResponse = await request(app.getHttpServer())
        .post('/api/games')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Journey Test Game',
          description: 'A game created during the user journey test',
          category: 'adventure',
          tags: ['test', 'journey'],
        });

      // Game creation might succeed or fail based on permissions
      expect([201, 403]).toContain(gameCreationResponse.status);

      let gameId: string | undefined;
      if (gameCreationResponse.status === 201) {
        gameId = gameCreationResponse.body.data.game.id;
      }

      // Step 6: Social Features (if available)
      const popularGamesResponse = await request(app.getHttpServer())
        .get('/api/games/popular')
        .set('Authorization', `Bearer ${accessToken}`);

      expect([200, 404]).toContain(popularGamesResponse.status); // Might not be implemented

      // Step 7: Password Change (Security Feature)
      const csrfResponse = await request(app.getHttpServer())
        .get('/api/auth/csrf-token')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(csrfResponse.status).toBe(200);
      const csrfToken = csrfResponse.body.data.csrfToken;

      const passwordChangeResponse = await request(app.getHttpServer())
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken)
        .send({
          currentPassword: 'SecureJourney123!',
          newPassword: 'NewSecureJourney456!',
        });

      expect(passwordChangeResponse.status).toBe(200);

      // Step 8: Logout
      const logoutResponse = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(logoutResponse.status).toBe(200);

      // Step 9: Verify Token Invalidation
      const afterLogoutResponse = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(afterLogoutResponse.status).toBe(401);

      // Step 10: Login with New Password
      const newLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'journey_user',
          password: 'NewSecureJourney456!',
        });

      expect(newLoginResponse.status).toBe(200);
      const newAccessToken = newLoginResponse.body.data.accessToken;

      // Step 11: Cleanup - Delete Avatar
      const deleteAvatarResponse = await request(app.getHttpServer())
        .delete(`/api/upload/files/${avatarFilename}`)
        .set('Authorization', `Bearer ${newAccessToken}`);

      expect(deleteAvatarResponse.status).toBe(200);

      // Step 12: Final Logout
      const finalLogoutResponse = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`);

      expect(finalLogoutResponse.status).toBe(200);

      // Verify Complete Audit Trail
      const journeyLogs = await auditLogRepository.find({
        where: { userId: journeyUserId },
        order: { createdAt: 'ASC' },
      });

      expect(journeyLogs.length).toBeGreaterThan(5); // Should have multiple audit events

      // Verify chronological order of key events
      const keyEvents = journeyLogs.map(log => log.eventType);
      expect(keyEvents).toContain(AuditEventType.USER_REGISTER);
      expect(keyEvents).toContain(AuditEventType.USER_LOGIN);
      expect(keyEvents).toContain(AuditEventType.USER_LOGOUT);
    });
  });

  describe('Admin User Journey', () => {
    let adminUser: any;
    let adminToken: string;

    beforeAll(async () => {
      // Create admin user
      adminUser = await createTestUser({
        username: 'e2e_admin_user',
        email: 'e2e_admin@example.com',
        nickname: 'E2E Admin User',
        role: 'admin',
      });

      const adminLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: adminUser.username,
          password: 'testpassword123',
        });

      adminToken = adminLoginResponse.body.data.accessToken;
    });

    afterAll(async () => {
      if (adminUser?.id) {
        await cleanupTestData([adminUser.id]);
      }
    });

    it('should allow admin to manage system and users', async () => {
      // Admin can access admin-only endpoints
      const adminUsersResponse = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminUsersResponse.status).toBe(200);

      // Admin can view audit logs
      const auditLogsResponse = await request(app.getHttpServer())
        .get('/api/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ limit: 10 });

      expect(auditLogsResponse.status).toBe(200);

      // Admin can export audit data
      const auditExportResponse = await request(app.getHttpServer())
        .get('/api/audit/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ format: 'json', limit: 5 });

      expect(auditExportResponse.status).toBe(200);

      // Admin can view system statistics
      const auditStatsResponse = await request(app.getHttpServer())
        .get('/api/audit/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(auditStatsResponse.status).toBe(200);

      // Admin operations should be logged with high severity
      const adminLogs = await auditLogRepository.find({
        where: { userId: adminUser.id },
        order: { createdAt: 'DESC' },
        take: 5,
      });

      adminLogs.forEach(log => {
        expect(log.severity).toBeGreaterThanOrEqual(3); // HIGH or CRITICAL
      });
    });
  });

  describe('Security Threat Response Journey', () => {
    it('should handle and respond to security threats appropriately', async () => {
      const suspiciousUser = await createTestUser({
        username: 'suspicious_user',
        email: 'suspicious@example.com',
        nickname: 'Suspicious User',
      });

      // Simulate brute force attack
      const bruteForceAttempts = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            username: suspiciousUser.username,
            password: 'wrongpassword',
          })
      );

      const bruteForceResponses = await Promise.all(bruteForceAttempts);

      // Some attempts should be rate limited
      const rateLimited = bruteForceResponses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);

      // Security events should be logged
      const securityLogs = await auditLogRepository.find({
        where: { eventType: AuditEventType.SECURITY_FAILED_LOGIN },
        order: { createdAt: 'DESC' },
        take: 10,
      });

      expect(securityLogs.length).toBeGreaterThan(5);

      // Attempt SQL injection
      const sqlInjectionResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: `' OR '1'='1`,
          password: 'malicious',
        });

      expect(sqlInjectionResponse.status).toBe(400);

      // Attempt XSS in registration
      const xssResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'xss_user',
          email: 'xss@example.com',
          password: 'Password123!',
          nickname: '<script>alert("xss")</script>',
        });

      expect(xssResponse.status).toBe(201); // Should succeed but sanitize input

      // Verify XSS was sanitized
      if (xssResponse.body.data?.user?.nickname) {
        expect(xssResponse.body.data.user.nickname).not.toContain('<script>');
      }

      // Cleanup
      if (xssResponse.body.data?.user?.id) {
        await cleanupTestData([xssResponse.body.data.user.id]);
      }
      await cleanupTestData([suspiciousUser.id]);
    });
  });

  describe('High Load and Performance Journey', () => {
    it('should maintain functionality under high concurrent load', async () => {
      const concurrentUsers = Array(5).fill(null).map((_, index) =>
        createTestUser({
          username: `load_test_user_${index}`,
          email: `load_test_${index}@example.com`,
          nickname: `Load Test User ${index}`,
        })
      );

      const loadTestUsers = await Promise.all(concurrentUsers);

      try {
        // Login all users concurrently
        const loginPromises = loadTestUsers.map((user, index) =>
          request(app.getHttpServer())
            .post('/api/auth/login')
            .send({
              username: user.username,
              password: 'testpassword123',
            })
        );

        const loginResponses = await Promise.all(loginPromises);

        loginResponses.forEach(response => {
          expect([200, 429]).toContain(response.status);
        });

        const successfulLogins = loginResponses.filter(r => r.status === 200);
        const tokens = successfulLogins.map(r => r.body.data.accessToken);

        // Perform concurrent operations
        const operations = tokens.flatMap(token => [
          request(app.getHttpServer())
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`),
          request(app.getHttpServer())
            .get('/api/games')
            .set('Authorization', `Bearer ${token}`),
        ]);

        const operationResponses = await Promise.all(operations);

        // Most operations should succeed (some may be rate limited)
        const successfulOps = operationResponses.filter(r => r.status === 200);
        expect(successfulOps.length).toBeGreaterThan(operations.length * 0.7); // At least 70% success rate

        // Verify audit logs were created for all operations
        const totalAuditLogs = await auditLogRepository.count();
        expect(totalAuditLogs).toBeGreaterThan(10);

        // Concurrent logout
        const logoutPromises = tokens.map(token =>
          request(app.getHttpServer())
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${token}`)
        );

        const logoutResponses = await Promise.all(logoutPromises);

        logoutResponses.forEach(response => {
          expect([200, 401]).toContain(response.status); // Success or already logged out
        });

      } finally {
        // Cleanup all load test users
        const userIds = loadTestUsers.map(u => u.id);
        await cleanupTestData(userIds);
      }
    });
  });

  describe('Data Integrity and Consistency Journey', () => {
    it('should maintain data integrity across complex operations', async () => {
      const integrityUser = await createTestUser({
        username: 'integrity_test_user',
        email: 'integrity_test@example.com',
        nickname: 'Integrity Test User',
      });

      let userToken: string;

      try {
        // Login
        const loginResponse = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            username: integrityUser.username,
            password: 'testpassword123',
          });

        userToken = loginResponse.body.data.accessToken;

        // Perform a series of state-changing operations
        const operations = [
          // Update profile multiple times
          () => request(app.getHttpServer())
            .put('/api/auth/me')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ nickname: 'Updated Name 1' }),

          () => request(app.getHttpServer())
            .put('/api/auth/me')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ nickname: 'Updated Name 2' }),

          // Upload avatar
          () => request(app.getHttpServer())
            .post('/api/upload/single/avatar')
            .set('Authorization', `Bearer ${userToken}`)
            .attach('avatar', Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), 'avatar.jpg'),

          // Change password
          async () => {
            const csrfResponse = await request(app.getHttpServer())
              .get('/api/auth/csrf-token')
              .set('Authorization', `Bearer ${userToken}`);

            const csrfToken = csrfResponse.body.data.csrfToken;

            return request(app.getHttpServer())
              .put('/api/auth/change-password')
              .set('Authorization', `Bearer ${userToken}`)
              .set('x-csrf-token', csrfToken)
              .send({
                currentPassword: 'testpassword123',
                newPassword: 'NewIntegrityPass789!',
              });
          },
        ];

        // Execute operations sequentially to avoid race conditions
        for (const operation of operations) {
          const result = await operation();
          expect([200, 201]).toContain(result.status);
        }

        // Verify final state
        const finalProfileResponse = await request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userToken}`);

        expect(finalProfileResponse.status).toBe(200);
        expect(finalProfileResponse.body.data.user.nickname).toBe('Updated Name 2');

        // Verify login with new password works
        const newLoginResponse = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            username: integrityUser.username,
            password: 'NewIntegrityPass789!',
          });

        expect(newLoginResponse.status).toBe(200);

        // Verify audit trail is consistent
        const auditLogs = await auditLogRepository.find({
          where: { userId: integrityUser.id },
          order: { createdAt: 'ASC' },
        });

        expect(auditLogs.length).toBeGreaterThan(3);

        // Verify no data corruption - all logs should belong to the same user
        auditLogs.forEach(log => {
          expect(log.userId).toBe(integrityUser.id);
          expect(log.username).toBeDefined();
        });

      } finally {
        // Cleanup
        await cleanupTestData([integrityUser.id]);
      }
    });
  });

  describe('Cross-System Integration Journey', () => {
    it('should demonstrate seamless integration between all system components', async () => {
      const integratedUser = await createTestUser({
        username: 'integrated_test_user',
        email: 'integrated_test@example.com',
        nickname: 'Integrated Test User',
      });

      let userToken: string;
      let uploadedFileId: string;

      try {
        // 1. Authentication Integration
        const loginResponse = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            username: integratedUser.username,
            password: 'testpassword123',
          });

        expect(loginResponse.status).toBe(200);
        userToken = loginResponse.body.data.accessToken;

        // 2. File Upload Integration
        const fileUploadResponse = await request(app.getHttpServer())
          .post('/api/upload/single/avatar')
          .set('Authorization', `Bearer ${userToken}`)
          .attach('avatar', Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), 'integrated-avatar.jpg');

        expect(fileUploadResponse.status).toBe(201);
        uploadedFileId = fileUploadResponse.body.data.filename;

        // 3. Profile Update with File Reference
        const profileUpdateResponse = await request(app.getHttpServer())
          .put('/api/auth/me')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            nickname: 'Integrated User',
            avatarUrl: fileUploadResponse.body.data.url,
          });

        expect(profileUpdateResponse.status).toBe(200);

        // 4. Game Interaction (if available)
        const gamesResponse = await request(app.getHttpServer())
          .get('/api/games')
          .set('Authorization', `Bearer ${userToken}`);

        expect(gamesResponse.status).toBe(200);

        // 5. Security Integration - Password Change
        const csrfResponse = await request(app.getHttpServer())
          .get('/api/auth/csrf-token')
          .set('Authorization', `Bearer ${userToken}`);

        expect(csrfResponse.status).toBe(200);
        const csrfToken = csrfResponse.body.data.csrfToken;

        const passwordChangeResponse = await request(app.getHttpServer())
          .put('/api/auth/change-password')
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-csrf-token', csrfToken)
          .send({
            currentPassword: 'testpassword123',
            newPassword: 'FullyIntegrated999!',
          });

        expect(passwordChangeResponse.status).toBe(200);

        // 6. Audit Integration - Verify all actions logged
        const auditLogs = await auditLogRepository.find({
          where: { userId: integratedUser.id },
          order: { createdAt: 'ASC' },
        });

        expect(auditLogs.length).toBeGreaterThan(5);

        // Verify audit log contains file upload event
        const fileUploadLogs = auditLogs.filter(log => log.eventType === 'FILE_UPLOAD');
        expect(fileUploadLogs.length).toBeGreaterThan(0);

        // 7. File Serving Integration
        const fileServeResponse = await request(app.getHttpServer())
          .get(fileUploadResponse.body.data.url);

        expect(fileServeResponse.status).toBe(200);

        // 8. Complete Logout
        const logoutResponse = await request(app.getHttpServer())
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${userToken}`);

        expect(logoutResponse.status).toBe(200);

        // 9. File Cleanup Integration
        const newLoginResponse = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            username: integratedUser.username,
            password: 'FullyIntegrated999!',
          });

        const newToken = newLoginResponse.body.data.accessToken;

        const fileDeleteResponse = await request(app.getHttpServer())
          .delete(`/api/upload/files/${uploadedFileId}`)
          .set('Authorization', `Bearer ${newToken}`);

        expect(fileDeleteResponse.status).toBe(200);

        // 10. Final Audit Verification
        const finalAuditLogs = await auditLogRepository.find({
          where: { userId: integratedUser.id },
          order: { createdAt: 'ASC' },
        });

        // Should have even more audit events now
        expect(finalAuditLogs.length).toBeGreaterThan(auditLogs.length);

        // Verify the complete journey is documented
        const eventTypes = finalAuditLogs.map(log => log.eventType);
        expect(eventTypes).toContain(AuditEventType.USER_LOGIN);
        expect(eventTypes).toContain(AuditEventType.USER_LOGOUT);
        expect(eventTypes).toContain('FILE_UPLOAD');
        expect(eventTypes).toContain('FILE_DELETE');

      } finally {
        // Cleanup
        await cleanupTestData([integratedUser.id]);
      }
    });
  });
});
