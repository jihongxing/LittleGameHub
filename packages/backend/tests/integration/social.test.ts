/**
 * Integration Tests for Social Features (User Story 6)
 * T151, T152, T153: Integration tests for friends, friend requests, and leaderboards
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendRelationship } from '../../src/modules/social/entities/friend-relationship.entity';
import { User } from '../../src/modules/auth/entities/user.entity';
import { GameSession } from '../../src/modules/games/entities/game-session.entity';

describe('Social Features - Integration Tests', () => {
  let app: INestApplication;
  let friendRepository: Repository<FriendRelationship>;
  let userRepository: Repository<User>;
  let sessionRepository: Repository<GameSession>;
  let authToken: string;
  let testUser: User;
  let friendUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    friendRepository = moduleFixture.get<Repository<FriendRelationship>>(
      getRepositoryToken(FriendRelationship),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    sessionRepository = moduleFixture.get<Repository<GameSession>>(
      getRepositoryToken(GameSession),
    );

    // Create test users
    testUser = await userRepository.save({
      username: 'social_test_user',
      email: 'social_test@example.com',
      password: 'hashedPassword123',
    });

    friendUser = await userRepository.save({
      username: 'friend_user',
      email: 'friend@example.com',
      password: 'hashedPassword123',
    });

    // Generate auth token (mock JWT)
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: 'hashedPassword123' });
    
    authToken = loginResponse.body.access_token || 'mock_token_for_testing';
  });

  afterAll(async () => {
    // Clean up test data
    if (friendRepository) {
      await friendRepository.delete({});
    }
    if (userRepository) {
      await userRepository.delete({});
    }
    if (sessionRepository) {
      await sessionRepository.delete({});
    }
    await app.close();
  });

  describe('T151: GET /friends - Get friend list', () => {
    beforeEach(async () => {
      // Create test friend relationship
      await friendRepository.save({
        user_id: testUser.id,
        friend_id: friendUser.id,
        status: 'accepted',
      });
    });

    afterEach(async () => {
      await friendRepository.delete({});
    });

    it('should return list of friends for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/friends')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('friends');
      expect(Array.isArray(response.body.friends)).toBe(true);
      expect(response.body.friends.length).toBeGreaterThanOrEqual(1);
      
      const friend = response.body.friends[0];
      expect(friend).toHaveProperty('id');
      expect(friend).toHaveProperty('username');
      expect(friend).toHaveProperty('status', 'accepted');
    });

    it('should filter friends by status', async () => {
      // Add pending friend request
      await friendRepository.save({
        user_id: testUser.id,
        friend_id: 999,
        status: 'pending',
      });

      const response = await request(app.getHttpServer())
        .get('/friends?status=accepted')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.friends.every((f: any) => f.status === 'accepted')).toBe(true);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/friends')
        .expect(401);
    });

    it('should return empty array if user has no friends', async () => {
      await friendRepository.delete({ user_id: testUser.id });

      const response = await request(app.getHttpServer())
        .get('/friends')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.friends).toEqual([]);
    });
  });

  describe('T152: POST /friends/requests - Send friend request', () => {
    afterEach(async () => {
      await friendRepository.delete({});
    });

    it('should send friend request successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/friends/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ friend_id: friendUser.id })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status', 'pending');
      expect(response.body).toHaveProperty('friend_id', friendUser.id);

      // Verify in database
      const savedRequest = await friendRepository.findOne({
        where: { user_id: testUser.id, friend_id: friendUser.id },
      });
      expect(savedRequest).toBeDefined();
      expect(savedRequest?.status).toBe('pending');
    });

    it('should accept friend request', async () => {
      // Create pending request from friend to user
      const pendingRequest = await friendRepository.save({
        user_id: friendUser.id,
        friend_id: testUser.id,
        status: 'pending',
      });

      const response = await request(app.getHttpServer())
        .patch(`/friends/requests/${pendingRequest.id}/accept`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'accepted');

      // Verify in database
      const acceptedRequest = await friendRepository.findOne({
        where: { id: pendingRequest.id },
      });
      expect(acceptedRequest?.status).toBe('accepted');
    });

    it('should reject friend request', async () => {
      // Create pending request
      const pendingRequest = await friendRepository.save({
        user_id: friendUser.id,
        friend_id: testUser.id,
        status: 'pending',
      });

      const response = await request(app.getHttpServer())
        .patch(`/friends/requests/${pendingRequest.id}/reject`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'rejected');
    });

    it('should return 400 if friend_id is missing', async () => {
      await request(app.getHttpServer())
        .post('/friends/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should return 404 if friend user does not exist', async () => {
      await request(app.getHttpServer())
        .post('/friends/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ friend_id: 999999 })
        .expect(404);
    });

    it('should return 409 if friend request already exists', async () => {
      // Create existing request
      await friendRepository.save({
        user_id: testUser.id,
        friend_id: friendUser.id,
        status: 'pending',
      });

      await request(app.getHttpServer())
        .post('/friends/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ friend_id: friendUser.id })
        .expect(409);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/friends/requests')
        .send({ friend_id: friendUser.id })
        .expect(401);
    });
  });

  describe('T153: GET /leaderboards - Get game leaderboards', () => {
    beforeEach(async () => {
      // Create test game sessions for leaderboard
      await sessionRepository.save([
        {
          user_id: testUser.id,
          game_id: 1,
          score: 1500,
          duration: 600,
          completed: true,
        },
        {
          user_id: friendUser.id,
          game_id: 1,
          score: 2000,
          duration: 500,
          completed: true,
        },
        {
          user_id: testUser.id,
          game_id: 2,
          score: 850,
          duration: 300,
          completed: true,
        },
      ]);
    });

    afterEach(async () => {
      await sessionRepository.delete({});
    });

    it('should return global leaderboard', async () => {
      const response = await request(app.getHttpServer())
        .get('/leaderboards?game_id=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('leaderboard');
      expect(Array.isArray(response.body.leaderboard)).toBe(true);
      expect(response.body.leaderboard.length).toBeGreaterThanOrEqual(2);
      
      const topPlayer = response.body.leaderboard[0];
      expect(topPlayer).toHaveProperty('user_id');
      expect(topPlayer).toHaveProperty('score');
      expect(topPlayer).toHaveProperty('rank', 1);

      // Verify descending order by score
      for (let i = 1; i < response.body.leaderboard.length; i++) {
        expect(response.body.leaderboard[i - 1].score).toBeGreaterThanOrEqual(
          response.body.leaderboard[i].score,
        );
      }
    });

    it('should return friends-only leaderboard', async () => {
      // Add friend relationship
      await friendRepository.save({
        user_id: testUser.id,
        friend_id: friendUser.id,
        status: 'accepted',
      });

      const response = await request(app.getHttpServer())
        .get('/leaderboards?game_id=1&scope=friends')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('leaderboard');
      expect(response.body.leaderboard.length).toBeGreaterThanOrEqual(1);
      
      // Should include friend's score
      const friendScore = response.body.leaderboard.find(
        (entry: any) => entry.user_id === friendUser.id,
      );
      expect(friendScore).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/leaderboards?game_id=1&page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.leaderboard).toHaveLength(1);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 1);
    });

    it('should return current user rank', async () => {
      const response = await request(app.getHttpServer())
        .get('/leaderboards?game_id=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('current_user_rank');
      expect(typeof response.body.current_user_rank).toBe('number');
    });

    it('should return 400 if game_id is missing', async () => {
      await request(app.getHttpServer())
        .get('/leaderboards')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should return empty leaderboard if no sessions exist', async () => {
      await sessionRepository.delete({});

      const response = await request(app.getHttpServer())
        .get('/leaderboards?game_id=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.leaderboard).toEqual([]);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/leaderboards?game_id=1')
        .expect(401);
    });
  });
});

