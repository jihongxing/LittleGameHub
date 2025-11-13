/**
 * Integration tests for Games API endpoints
 * User Story 1: Browse and Play Mini-Games
 * 
 * Tests:
 * - T036: GET /games endpoint
 * - T037: GET /games/{gameId} endpoint
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { GlobalValidationPipe } from '../../src/common/pipes/validation.pipe';

describe('Games API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testGameId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new GlobalValidationPipe());
    await app.init();

    // TODO: Setup test user and authentication
    // authToken = await getTestAuthToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /games (T036)', () => {
    it('should return game catalog with default pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/games')
        .expect(200);

      expect(response.body).toHaveProperty('games');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.games)).toBe(true);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: expect.any(Number),
        total_pages: expect.any(Number),
      });
    });

    it('should filter games by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/games?category=puzzle')
        .expect(200);

      expect(response.body.games).toBeInstanceOf(Array);
      // Verify all returned games have 'puzzle' in their category_tags
      response.body.games.forEach((game: any) => {
        expect(game.category_tags).toContain('puzzle');
      });
    });

    it('should search games by title', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/games?search=tetris')
        .expect(200);

      expect(response.body.games).toBeInstanceOf(Array);
      // Results should contain the search term in title or description
      if (response.body.games.length > 0) {
        const game = response.body.games[0];
        const searchTerm = 'tetris';
        expect(
          game.title.toLowerCase().includes(searchTerm) ||
          game.description.toLowerCase().includes(searchTerm)
        ).toBe(true);
      }
    });

    it('should paginate results correctly', async () => {
      const page1 = await request(app.getHttpServer())
        .get('/api/v1/games?page=1&limit=5')
        .expect(200);

      const page2 = await request(app.getHttpServer())
        .get('/api/v1/games?page=2&limit=5')
        .expect(200);

      expect(page1.body.games.length).toBeLessThanOrEqual(5);
      expect(page2.body.games.length).toBeLessThanOrEqual(5);
      
      // Ensure different results on different pages (if there are enough games)
      if (page1.body.pagination.total > 5) {
        expect(page1.body.games[0].id).not.toBe(page2.body.games[0].id);
      }
    });

    it('should sort games by popularity', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/games?sort=popular')
        .expect(200);

      expect(response.body.games).toBeInstanceOf(Array);
      
      // Verify games are sorted by play_count in descending order
      if (response.body.games.length > 1) {
        for (let i = 0; i < response.body.games.length - 1; i++) {
          expect(response.body.games[i].play_count)
            .toBeGreaterThanOrEqual(response.body.games[i + 1].play_count);
        }
      }
    });

    it('should filter by availability status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/games?status=active')
        .expect(200);

      expect(response.body.games).toBeInstanceOf(Array);
      response.body.games.forEach((game: any) => {
        expect(game.availability_status).toBe('active');
      });
    });

    it('should return empty array when no games match filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/games?category=nonexistent_category_xyz')
        .expect(200);

      expect(response.body.games).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });
  });

  describe('GET /games/{gameId} (T037)', () => {
    beforeAll(async () => {
      // Get a test game ID from the catalog
      const response = await request(app.getHttpServer())
        .get('/api/v1/games?limit=1')
        .expect(200);
      
      if (response.body.games.length > 0) {
        testGameId = response.body.games[0].id;
      }
    });

    it('should return game details for valid game ID', async () => {
      if (!testGameId) {
        pending('No test game available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/api/v1/games/${testGameId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testGameId,
        title: expect.any(String),
        description: expect.any(String),
        cover_image_url: expect.any(String),
        game_url: expect.any(String),
        category_tags: expect.any(Array),
        point_reward_rules: expect.any(Object),
        min_play_duration_seconds: expect.any(Number),
        play_count: expect.any(Number),
        version: expect.any(String),
      });

      // Verify point_reward_rules structure
      expect(response.body.point_reward_rules).toHaveProperty('base_points');
      expect(response.body.point_reward_rules).toHaveProperty('min_duration_seconds');
    });

    it('should return 404 for non-existent game ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      await request(app.getHttpServer())
        .get(`/api/v1/games/${fakeId}`)
        .expect(404);
    });

    it('should return 400 for invalid game ID format', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/games/invalid-uuid')
        .expect(400);
    });

    it('should include average rating if available', async () => {
      if (!testGameId) {
        pending('No test game available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/api/v1/games/${testGameId}`)
        .expect(200);

      if (response.body.average_rating !== null) {
        expect(response.body.average_rating).toBeGreaterThanOrEqual(0);
        expect(response.body.average_rating).toBeLessThanOrEqual(5);
      }
    });
  });
});

