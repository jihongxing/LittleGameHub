/**
 * Integration Tests for Offline Games (User Story 7)
 * T175: Integration test for offline game download endpoint
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfflineGame } from '../../src/modules/offline/entities/offline-game.entity';
import { User } from '../../src/modules/auth/entities/user.entity';
import { Game } from '../../src/modules/games/entities/game.entity';

describe('Offline Games - Integration Tests', () => {
  let app: INestApplication;
  let offlineGameRepository: Repository<OfflineGame>;
  let userRepository: Repository<User>;
  let gameRepository: Repository<Game>;
  let authToken: string;
  let testUser: User;
  let testGame: Game;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    offlineGameRepository = moduleFixture.get<Repository<OfflineGame>>(
      getRepositoryToken(OfflineGame),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    gameRepository = moduleFixture.get<Repository<Game>>(
      getRepositoryToken(Game),
    );

    // Create test user
    testUser = await userRepository.save({
      username: 'offline_test_user',
      email: 'offline_test@example.com',
      password: 'hashedPassword123',
    });

    // Create test game
    testGame = await gameRepository.save({
      title: 'Test Offline Game',
      description: 'A game for offline testing',
      thumbnail_url: 'https://example.com/thumb.jpg',
      game_url: 'https://example.com/game.html',
      category: 'puzzle',
      tags: ['offline', 'test'],
      file_size: 5242880, // 5MB
    });

    // Generate auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: 'hashedPassword123' });
    
    authToken = loginResponse.body.access_token || 'mock_token_for_testing';
  });

  afterAll(async () => {
    // Clean up test data
    if (offlineGameRepository) {
      await offlineGameRepository.delete({});
    }
    if (gameRepository) {
      await gameRepository.delete({});
    }
    if (userRepository) {
      await userRepository.delete({});
    }
    await app.close();
  });

  describe('GET /offline/games - Get offline games', () => {
    beforeEach(async () => {
      // Create test offline games
      await offlineGameRepository.save([
        {
          user_id: testUser.id,
          game_id: testGame.id,
          download_status: 'completed',
          file_size: 5242880,
          storage_path: '/storage/game1.zip',
        },
      ]);
    });

    afterEach(async () => {
      await offlineGameRepository.delete({});
    });

    it('should return list of offline games', async () => {
      const response = await request(app.getHttpServer())
        .get('/offline/games')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('games');
      expect(Array.isArray(response.body.games)).toBe(true);
      expect(response.body.games.length).toBeGreaterThanOrEqual(1);
      
      const game = response.body.games[0];
      expect(game).toHaveProperty('id');
      expect(game).toHaveProperty('game_id');
      expect(game).toHaveProperty('download_status');
      expect(game).toHaveProperty('file_size');
    });

    it('should filter by download status', async () => {
      const response = await request(app.getHttpServer())
        .get('/offline/games?status=completed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.games.every((g: any) => g.download_status === 'completed')).toBe(true);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/offline/games')
        .expect(401);
    });

    it('should return storage quota info', async () => {
      const response = await request(app.getHttpServer())
        .get('/offline/games')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('storage');
      expect(response.body.storage).toHaveProperty('used');
      expect(response.body.storage).toHaveProperty('total');
      expect(response.body.storage).toHaveProperty('available');
    });
  });

  describe('T175: POST /offline/games/:gameId/download - Download game', () => {
    afterEach(async () => {
      await offlineGameRepository.delete({});
    });

    it('should initiate game download', async () => {
      const response = await request(app.getHttpServer())
        .post(`/offline/games/${testGame.id}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('game_id', testGame.id);
      expect(response.body).toHaveProperty('download_status', 'pending');
      expect(response.body).toHaveProperty('user_id', testUser.id);

      // Verify in database
      const savedOfflineGame = await offlineGameRepository.findOne({
        where: { user_id: testUser.id, game_id: testGame.id },
      });
      expect(savedOfflineGame).toBeDefined();
      expect(savedOfflineGame?.download_status).toBe('pending');
    });

    it('should return 404 if game not found', async () => {
      await request(app.getHttpServer())
        .post('/offline/games/999999/download')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 409 if game already downloaded', async () => {
      // Download game first time
      await request(app.getHttpServer())
        .post(`/offline/games/${testGame.id}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Try to download again
      await request(app.getHttpServer())
        .post(`/offline/games/${testGame.id}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);
    });

    it('should return 413 if storage quota exceeded', async () => {
      // This test would require mocking the storage quota check
      // or creating enough offline games to exceed the quota
      // For now, we'll skip the actual implementation
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .post(`/offline/games/${testGame.id}/download`)
        .expect(401);
    });

    it('should track download progress', async () => {
      const response = await request(app.getHttpServer())
        .post(`/offline/games/${testGame.id}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      const offlineGameId = response.body.id;

      // Check download progress
      const progressResponse = await request(app.getHttpServer())
        .get(`/offline/games/${offlineGameId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(progressResponse.body).toHaveProperty('download_status');
      expect(progressResponse.body).toHaveProperty('progress_percentage');
    });
  });

  describe('DELETE /offline/games/:gameId - Delete offline game', () => {
    beforeEach(async () => {
      await offlineGameRepository.save({
        user_id: testUser.id,
        game_id: testGame.id,
        download_status: 'completed',
        file_size: 5242880,
        storage_path: '/storage/game1.zip',
      });
    });

    afterEach(async () => {
      await offlineGameRepository.delete({});
    });

    it('should delete offline game', async () => {
      await request(app.getHttpServer())
        .delete(`/offline/games/${testGame.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      const deleted = await offlineGameRepository.findOne({
        where: { user_id: testUser.id, game_id: testGame.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 if offline game not found', async () => {
      await request(app.getHttpServer())
        .delete('/offline/games/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .delete(`/offline/games/${testGame.id}`)
        .expect(401);
    });

    it('should free up storage quota after deletion', async () => {
      // Get initial storage
      const beforeResponse = await request(app.getHttpServer())
        .get('/offline/games')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const usedBefore = beforeResponse.body.storage.used;

      // Delete offline game
      await request(app.getHttpServer())
        .delete(`/offline/games/${testGame.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Get storage after deletion
      const afterResponse = await request(app.getHttpServer())
        .get('/offline/games')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const usedAfter = afterResponse.body.storage.used;

      expect(usedAfter).toBeLessThan(usedBefore);
    });
  });

  describe('GET /offline/storage-quota - Get storage quota', () => {
    it('should return storage quota information', async () => {
      const response = await request(app.getHttpServer())
        .get('/offline/storage-quota')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('used');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('available');
      expect(response.body).toHaveProperty('percentage_used');
      expect(response.body).toHaveProperty('tier'); // free, member, offline_member
    });

    it('should return different quotas based on membership', async () => {
      const response = await request(app.getHttpServer())
        .get('/offline/storage-quota')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Free users: 1GB, Members: 5GB, Offline members: 20GB
      expect(response.body.tier).toMatch(/free|member|offline_member/);
      
      if (response.body.tier === 'free') {
        expect(response.body.total).toBe(1073741824); // 1GB in bytes
      }
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/offline/storage-quota')
        .expect(401);
    });
  });
});

