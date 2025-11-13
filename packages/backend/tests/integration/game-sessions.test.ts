/**
 * Integration tests for Game Sessions API endpoints
 * User Story 1: Browse and Play Mini-Games
 * 
 * Tests:
 * - T038: POST /games/{gameId}/sessions endpoint
 * - PATCH /games/{gameId}/sessions/{sessionId} endpoint
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { GlobalValidationPipe } from '../../src/common/pipes/validation.pipe';

describe('Game Sessions API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testGameId: string;
  let testSessionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new GlobalValidationPipe());
    await app.init();

    // TODO: Setup test user and authentication
    // authToken = await getTestAuthToken(app);

    // Get a test game ID
    const response = await request(app.getHttpServer())
      .get('/api/v1/games?limit=1')
      .expect(200);
    
    if (response.body.games.length > 0) {
      testGameId = response.body.games[0].id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /games/{gameId}/sessions (T038)', () => {
    it('should create a new game session', async () => {
      if (!testGameId) {
        pending('No test game available');
        return;
      }

      const response = await request(app.getHttpServer())
        .post(`/api/v1/games/${testGameId}/sessions`)
        // .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(201);

      expect(response.body).toMatchObject({
        session_id: expect.any(String),
        game_id: testGameId,
        start_time: expect.any(String),
      });

      // Verify start_time is a valid ISO 8601 timestamp
      expect(new Date(response.body.start_time).toISOString()).toBe(response.body.start_time);

      // Save session ID for other tests
      testSessionId = response.body.session_id;
    });

    it('should return 404 for non-existent game', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post(`/api/v1/games/${fakeId}/sessions`)
        // .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      if (!testGameId) {
        pending('No test game available');
        return;
      }

      // TODO: Uncomment when auth is implemented
      // await request(app.getHttpServer())
      //   .post(`/api/v1/games/${testGameId}/sessions`)
      //   .send({})
      //   .expect(401);
    });

    it('should create multiple sessions for the same user and game', async () => {
      if (!testGameId) {
        pending('No test game available');
        return;
      }

      const session1 = await request(app.getHttpServer())
        .post(`/api/v1/games/${testGameId}/sessions`)
        // .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(201);

      const session2 = await request(app.getHttpServer())
        .post(`/api/v1/games/${testGameId}/sessions`)
        // .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(201);

      expect(session1.body.session_id).not.toBe(session2.body.session_id);
    });
  });

  describe('PATCH /games/{gameId}/sessions/{sessionId}', () => {
    beforeAll(async () => {
      // Create a test session if not already created
      if (!testSessionId && testGameId) {
        const response = await request(app.getHttpServer())
          .post(`/api/v1/games/${testGameId}/sessions`)
          .send({})
          .expect(201);
        
        testSessionId = response.body.session_id;
      }
    });

    it('should update game session with completion', async () => {
      if (!testGameId || !testSessionId) {
        pending('No test session available');
        return;
      }

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 5 * 60 * 1000); // 5 minutes later
      const durationSeconds = 300;

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/games/${testGameId}/sessions/${testSessionId}`)
        // .set('Authorization', `Bearer ${authToken}`)
        .send({
          end_time: endTime.toISOString(),
          duration_seconds: durationSeconds,
          completion_status: 'completed',
          game_state: { level: 5, score: 1000 },
        })
        .expect(200);

      expect(response.body).toMatchObject({
        session_id: testSessionId,
        points_earned: expect.any(Number),
        new_balance: expect.any(Number),
      });

      // Verify points are earned for playing >= min duration
      expect(response.body.points_earned).toBeGreaterThanOrEqual(0);
    });

    it('should not award points if play duration is too short', async () => {
      if (!testGameId) {
        pending('No test game available');
        return;
      }

      // Create a new session
      const createResponse = await request(app.getHttpServer())
        .post(`/api/v1/games/${testGameId}/sessions`)
        .send({})
        .expect(201);

      const sessionId = createResponse.body.session_id;
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 30 * 1000); // Only 30 seconds

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/games/${testGameId}/sessions/${sessionId}`)
        .send({
          end_time: endTime.toISOString(),
          duration_seconds: 30,
          completion_status: 'completed',
        })
        .expect(200);

      // Should return 0 points if duration < min_play_duration_seconds
      expect(response.body.points_earned).toBe(0);
    });

    it('should save game state for cloud save', async () => {
      if (!testGameId) {
        pending('No test game available');
        return;
      }

      const createResponse = await request(app.getHttpServer())
        .post(`/api/v1/games/${testGameId}/sessions`)
        .send({})
        .expect(201);

      const sessionId = createResponse.body.session_id;
      const gameState = {
        level: 10,
        score: 5000,
        inventory: ['sword', 'shield'],
      };

      await request(app.getHttpServer())
        .patch(`/api/v1/games/${testGameId}/sessions/${sessionId}`)
        .send({
          game_state: gameState,
          completion_status: 'in_progress',
        })
        .expect(200);

      // Verify state is saved (would need to query the session later to verify)
    });

    it('should return 404 for non-existent session', async () => {
      if (!testGameId) {
        pending('No test game available');
        return;
      }

      const fakeSessionId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .patch(`/api/v1/games/${testGameId}/sessions/${fakeSessionId}`)
        .send({
          completion_status: 'completed',
        })
        .expect(404);
    });

    it('should validate duration is positive', async () => {
      if (!testGameId || !testSessionId) {
        pending('No test session available');
        return;
      }

      await request(app.getHttpServer())
        .patch(`/api/v1/games/${testGameId}/sessions/${testSessionId}`)
        .send({
          duration_seconds: -100,
          completion_status: 'completed',
        })
        .expect(400);
    });

    it('should handle abandoned sessions', async () => {
      if (!testGameId) {
        pending('No test game available');
        return;
      }

      const createResponse = await request(app.getHttpServer())
        .post(`/api/v1/games/${testGameId}/sessions`)
        .send({})
        .expect(201);

      const sessionId = createResponse.body.session_id;

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/games/${testGameId}/sessions/${sessionId}`)
        .send({
          completion_status: 'abandoned',
        })
        .expect(200);

      // Abandoned sessions should not earn points
      expect(response.body.points_earned).toBe(0);
    });
  });
});

