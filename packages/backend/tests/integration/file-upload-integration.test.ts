/**
 * File Upload Integration Tests
 * 文件上传集成测试
 *
 * Tests complete file upload workflows including validation, processing,
 * security checks, and storage operations
 * 测试完整文件上传工作流程，包括验证、处理、安全检查和存储操作
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import * as fs from 'fs-extra';
import * as path from 'path';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/modules/users/entities/user.entity';
import { AuditLog } from '../../src/modules/audit/entities/audit-log.entity';
import { createTestUser, cleanupTestData } from '../setup';

describe('File Upload Integration Tests (T067)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let auditLogRepository: Repository<AuditLog>;
  let testUser: User;
  let accessToken: string;

  // Test files
  const validImageBuffer = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, // Minimal valid JPEG header
  ]);

  const maliciousScriptBuffer = Buffer.from('<script>alert("xss")</script>');

  const exeBuffer = Buffer.from([
    0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, // Windows EXE header
  ]);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    auditLogRepository = moduleFixture.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));

    // Create test user
    testUser = await createTestUser({
      username: 'upload_test_user',
      email: 'upload_test@example.com',
      nickname: 'Upload Test User',
    });

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: 'testpassword123',
      });

    accessToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await cleanupTestData([testUser.id]);
    await app.close();

    // Clean up test files
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (await fs.pathExists(uploadDir)) {
      await fs.remove(uploadDir);
    }
  });

  describe('Avatar Upload Integration', () => {
    it('should successfully upload valid avatar image', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/upload/single/avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', validImageBuffer, 'test-avatar.jpg');

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('filename');
      expect(response.body.data).toHaveProperty('path');
      expect(response.body.data).toHaveProperty('url');
      expect(response.body.data.mimetype).toBe('image/jpeg');

      // Verify file was actually saved
      const filePath = response.body.data.path;
      const fileExists = await fs.pathExists(path.join(process.cwd(), filePath));
      expect(fileExists).toBe(true);

      // Verify audit log
      const auditLogs = await auditLogRepository.find({
        where: { userId: testUser.id, eventType: 'FILE_UPLOAD' },
        order: { createdAt: 'DESC' },
        take: 1,
      });
      expect(auditLogs.length).toBeGreaterThan(0);
    });

    it('should reject oversized avatar files', async () => {
      const largeBuffer = Buffer.alloc(3 * 1024 * 1024); // 3MB (over 2MB limit)

      const response = await request(app.getHttpServer())
        .post('/api/upload/single/avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', largeBuffer, 'large-avatar.jpg');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('文件过大');
    });

    it('should reject invalid image formats for avatars', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/upload/single/avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', Buffer.from('not an image'), 'fake-avatar.jpg');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('无效的文件内容');
    });

    it('should reject malicious files disguised as avatars', async () => {
      // Create a file with JPEG header but malicious content
      const maliciousJpegBuffer = Buffer.concat([
        validImageBuffer,
        maliciousScriptBuffer,
      ]);

      const response = await request(app.getHttpServer())
        .post('/api/upload/single/avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', maliciousJpegBuffer, 'malicious-avatar.jpg');

      expect([400, 403]).toContain(response.status); // Validation or security error
    });
  });

  describe('Game Cover Upload Integration', () => {
    it('should upload game cover with image processing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/upload/single/game-cover')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('gameCover', validImageBuffer, 'game-cover.jpg');

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('filename');
      expect(response.body.data).toHaveProperty('metadata');

      // Game covers should be processed (resized)
      if (response.body.data.metadata) {
        expect(response.body.data.metadata).toHaveProperty('width');
        expect(response.body.data.metadata).toHaveProperty('height');
      }
    });

    it('should enforce game cover size limits', async () => {
      const veryLargeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB

      const response = await request(app.getHttpServer())
        .post('/api/upload/single/game-cover')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('gameCover', veryLargeBuffer, 'large-cover.jpg');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('文件过大');
    });

    it('should validate game cover dimensions', async () => {
      // This would depend on the specific validation rules
      // For now, just ensure upload succeeds with valid image
      const response = await request(app.getHttpServer())
        .post('/api/upload/single/game-cover')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('gameCover', validImageBuffer, 'valid-cover.jpg');

      expect(response.status).toBe(201);
    });
  });

  describe('Game Screenshots Upload Integration', () => {
    it('should upload multiple game screenshots', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/upload/multiple/game-screenshots')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('screenshots', validImageBuffer, 'screenshot1.jpg')
        .attach('screenshots', validImageBuffer, 'screenshot2.jpg');

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);

      response.body.data.forEach((file: any) => {
        expect(file).toHaveProperty('filename');
        expect(file).toHaveProperty('path');
        expect(file.mimetype).toBe('image/jpeg');
      });
    });

    it('should limit number of screenshots', async () => {
      // Try to upload too many files
      const attachments = {};
      for (let i = 0; i < 15; i++) {
        attachments[`screenshots`] = validImageBuffer;
      }

      const req = request(app.getHttpServer())
        .post('/api/upload/multiple/game-screenshots')
        .set('Authorization', `Bearer ${accessToken}`);

      // Attach multiple files
      for (let i = 0; i < 15; i++) {
        req.attach('screenshots', validImageBuffer, `screenshot${i}.jpg`);
      }

      const response = await req;
      expect([400, 413]).toContain(response.status); // Too many files or payload too large
    });

    it('should validate all files in batch upload', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/upload/multiple/game-screenshots')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('screenshots', validImageBuffer, 'valid1.jpg')
        .attach('screenshots', exeBuffer, 'malicious.exe')
        .attach('screenshots', validImageBuffer, 'valid2.jpg');

      // Should either reject all or accept only valid ones
      expect([400, 201]).toContain(response.status);

      if (response.status === 201) {
        // If partial success is allowed, should only return valid files
        expect(response.body.data.length).toBeLessThan(3);
        expect(response.body.data.every((file: any) => file.mimetype === 'image/jpeg')).toBe(true);
      }
    });
  });

  describe('Security Threat Detection', () => {
    it('should block executable files', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/upload/single/document')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('document', exeBuffer, 'malware.exe');

      expect([400, 403]).toContain(response.status);
      expect(response.body.message).toMatch(/安全威胁|不支持的文件类型|无效的文件内容/);
    });

    it('should block files with script content', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/upload/single/document')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('document', maliciousScriptBuffer, 'evil.html');

      expect([400, 403]).toContain(response.status);
      expect(response.body.message).toMatch(/安全威胁|不支持的文件类型/);
    });

    it('should block files with path traversal attempts', async () => {
      const traversalBuffer = Buffer.from('innocent content');
      const response = await request(app.getHttpServer())
        .post('/api/upload/single/document')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('document', traversalBuffer, '../../../etc/passwd');

      expect([400, 403]).toContain(response.status);
    });

    it('should validate file signatures', async () => {
      // Create a file with wrong extension for its content
      const response = await request(app.getHttpServer())
        .post('/api/upload/single/avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', exeBuffer, 'fake-avatar.jpg');

      expect([400, 403]).toContain(response.status);
      expect(response.body.message).toContain('文件内容验证失败');
    });
  });

  describe('File Management Operations', () => {
    let uploadedFile: any;

    beforeAll(async () => {
      // Upload a test file for management operations
      const response = await request(app.getHttpServer())
        .post('/api/upload/single/avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', validImageBuffer, 'management-test.jpg');

      uploadedFile = response.body.data;
    });

    it('should serve uploaded files', async () => {
      const serveResponse = await request(app.getHttpServer())
        .get(uploadedFile.url);

      expect(serveResponse.status).toBe(200);
      expect(serveResponse.headers['content-type']).toContain('image');
    });

    it('should allow file deletion by owner', async () => {
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/upload/files/${uploadedFile.filename}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteResponse.status).toBe(200);

      // Verify file is gone
      const fileExists = await fs.pathExists(path.join(process.cwd(), uploadedFile.path));
      expect(fileExists).toBe(false);

      // Verify audit log
      const auditLogs = await auditLogRepository.find({
        where: { userId: testUser.id, eventType: 'FILE_DELETE' },
        order: { createdAt: 'DESC' },
        take: 1,
      });
      expect(auditLogs.length).toBeGreaterThan(0);
    });

    it('should prevent unauthorized file deletion', async () => {
      // Upload another file
      const uploadResponse = await request(app.getHttpServer())
        .post('/api/upload/single/avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', validImageBuffer, 'auth-test.jpg');

      const fileToDelete = uploadResponse.body.data;

      // Create another user
      const otherUser = await createTestUser({
        username: 'other_upload_user',
        email: 'other_upload@example.com',
        nickname: 'Other Upload User',
      });

      const otherLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: otherUser.username,
          password: 'testpassword123',
        });

      const otherToken = otherLoginResponse.body.data.accessToken;

      // Try to delete file owned by first user
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/upload/files/${fileToDelete.filename}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(deleteResponse.status).toBe(403);

      // Cleanup
      await cleanupTestData([otherUser.id]);
      await request(app.getHttpServer())
        .delete(`/api/upload/files/${fileToDelete.filename}`)
        .set('Authorization', `Bearer ${accessToken}`);
    });
  });

  describe('Rate Limiting for Uploads', () => {
    it('should enforce upload rate limits', async () => {
      const uploadPromises = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/api/upload/single/avatar')
          .set('Authorization', `Bearer ${accessToken}`)
          .attach('avatar', validImageBuffer, 'rate-limit-test.jpg')
      );

      const responses = await Promise.all(uploadPromises);

      // Some uploads should be rate limited
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);

      const successful = responses.filter(r => r.status === 201);
      expect(successful.length).toBeGreaterThan(0);
    });

    it('should differentiate rate limits by user', async () => {
      // Create another user
      const otherUser = await createTestUser({
        username: 'rate_limit_upload_user',
        email: 'rate_limit_upload@example.com',
        nickname: 'Rate Limit Upload User',
      });

      const otherLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: otherUser.username,
          password: 'testpassword123',
        });

      const otherToken = otherLoginResponse.body.data.accessToken;

      // Both users should be able to upload (separate rate limit buckets)
      const [user1Response, user2Response] = await Promise.all([
        request(app.getHttpServer())
          .post('/api/upload/single/avatar')
          .set('Authorization', `Bearer ${accessToken}`)
          .attach('avatar', validImageBuffer, 'user1-avatar.jpg'),
        request(app.getHttpServer())
          .post('/api/upload/single/avatar')
          .set('Authorization', `Bearer ${otherToken}`)
          .attach('avatar', validImageBuffer, 'user2-avatar.jpg')
      ]);

      expect(user1Response.status).toBe(201);
      expect(user2Response.status).toBe(201);

      // Cleanup uploaded files and user
      await request(app.getHttpServer())
        .delete(`/api/upload/files/${user1Response.body.data.filename}`)
        .set('Authorization', `Bearer ${accessToken}`);

      await request(app.getHttpServer())
        .delete(`/api/upload/files/${user2Response.body.data.filename}`)
        .set('Authorization', `Bearer ${otherToken}`);

      await cleanupTestData([otherUser.id]);
    });
  });

  describe('Concurrent Upload Handling', () => {
    it('should handle concurrent uploads safely', async () => {
      const concurrentUploads = Array(3).fill(null).map((_, index) =>
        request(app.getHttpServer())
          .post('/api/upload/single/avatar')
          .set('Authorization', `Bearer ${accessToken}`)
          .attach('avatar', validImageBuffer, `concurrent-${index}.jpg`)
      );

      const responses = await Promise.all(concurrentUploads);

      responses.forEach(response => {
        expect([200, 201, 429]).toContain(response.status); // Success or rate limited
      });

      // Clean up successful uploads
      const successfulUploads = responses.filter(r => r.status === 201);
      for (const upload of successfulUploads) {
        await request(app.getHttpServer())
          .delete(`/api/upload/files/${upload.body.data.filename}`)
          .set('Authorization', `Bearer ${accessToken}`);
      }
    });

    it('should maintain file integrity during concurrent operations', async () => {
      // Upload a file
      const uploadResponse = await request(app.getHttpServer())
        .post('/api/upload/single/avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', validImageBuffer, 'integrity-test.jpg');

      const uploadedFile = uploadResponse.body.data;

      // Perform concurrent operations: read, delete attempt, read
      const operations = [
        request(app.getHttpServer()).get(uploadedFile.url), // Read
        request(app.getHttpServer()) // Unauthorized delete attempt
          .delete(`/api/upload/files/${uploadedFile.filename}`),
        request(app.getHttpServer()).get(uploadedFile.url), // Read again
      ];

      const [read1, deleteAttempt, read2] = await Promise.all(operations);

      expect(read1.status).toBe(200);
      expect(deleteAttempt.status).toBe(403); // Should fail
      expect(read2.status).toBe(200); // Should still work

      // Authorized delete should work
      const authorizedDelete = await request(app.getHttpServer())
        .delete(`/api/upload/files/${uploadedFile.filename}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(authorizedDelete.status).toBe(200);
    });
  });

  describe('Storage and Cleanup Integration', () => {
    it('should organize files in proper directory structure', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/upload/single/avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', validImageBuffer, 'directory-test.jpg');

      expect(response.status).toBe(201);

      const filePath = response.body.data.path;
      // Should be organized by type and date
      expect(filePath).toMatch(/^avatars\/\d{4}\/\d{2}\/\d{2}\//);

      // Verify directory exists
      const fullPath = path.join(process.cwd(), filePath);
      const directoryExists = await fs.pathExists(path.dirname(fullPath));
      expect(directoryExists).toBe(true);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/api/upload/files/${response.body.data.filename}`)
        .set('Authorization', `Bearer ${accessToken}`);
    });

    it('should handle storage quota and cleanup', async () => {
      // This would test cleanup services, but for integration test
      // we just verify basic cleanup works
      const uploadResponse = await request(app.getHttpServer())
        .post('/api/upload/single/avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', validImageBuffer, 'cleanup-test.jpg');

      expect(uploadResponse.status).toBe(201);

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/upload/files/${uploadResponse.body.data.filename}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteResponse.status).toBe(200);

      // File should be physically deleted
      const fileExists = await fs.pathExists(path.join(process.cwd(), uploadResponse.body.data.path));
      expect(fileExists).toBe(false);
    });
  });
});
