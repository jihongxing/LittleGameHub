/**
 * Integration tests for Rewards API endpoints
 * User Story 2: Earn and Manage Points
 * 
 * Tests:
 * - T064: POST /rewards/{rewardId}/redeem endpoint
 * - GET /rewards endpoint
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { GlobalValidationPipe } from '../../src/common/pipes/validation.pipe';

describe('Rewards API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let testRewardId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new GlobalValidationPipe());
    await app.init();

    // TODO: Setup test user and authentication
    // const auth = await getTestAuthToken(app);
    // authToken = auth.token;
    // userId = auth.userId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /rewards', () => {
    it('should return available rewards', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/rewards')
        .expect(200);

      expect(response.body).toHaveProperty('rewards');
      expect(Array.isArray(response.body.rewards)).toBe(true);

      if (response.body.rewards.length > 0) {
        const reward = response.body.rewards[0];
        testRewardId = reward.id;

        expect(reward).toHaveProperty('id');
        expect(reward).toHaveProperty('name');
        expect(reward).toHaveProperty('description');
        expect(reward).toHaveProperty('point_cost');
        expect(reward).toHaveProperty('reward_type');
        expect(reward).toHaveProperty('availability_status');
        expect(typeof reward.point_cost).toBe('number');
        expect(reward.point_cost).toBeGreaterThan(0);
      }
    });

    it('should filter rewards by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/rewards?type=membership_trial')
        .expect(200);

      expect(response.body.rewards).toBeInstanceOf(Array);
      response.body.rewards.forEach((reward: any) => {
        expect(reward.reward_type).toBe('membership_trial');
      });
    });

    it('should filter rewards by point range', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/rewards?min_points=100&max_points=500')
        .expect(200);

      expect(response.body.rewards).toBeInstanceOf(Array);
      response.body.rewards.forEach((reward: any) => {
        expect(reward.point_cost).toBeGreaterThanOrEqual(100);
        expect(reward.point_cost).toBeLessThanOrEqual(500);
      });
    });

    it('should show only available rewards by default', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/rewards')
        .expect(200);

      expect(response.body.rewards).toBeInstanceOf(Array);
      response.body.rewards.forEach((reward: any) => {
        expect(reward.availability_status).toBe('available');
      });
    });

    it('should include stock quantity for limited rewards', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/rewards')
        .expect(200);

      const limitedReward = response.body.rewards.find(
        (r: any) => r.stock_quantity !== null
      );

      if (limitedReward) {
        expect(typeof limitedReward.stock_quantity).toBe('number');
        expect(limitedReward.stock_quantity).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('POST /rewards/{rewardId}/redeem (T064)', () => {
    beforeAll(async () => {
      // Get a test reward
      const response = await request(app.getHttpServer())
        .get('/api/v1/rewards?min_points=0&max_points=100')
        .expect(200);

      if (response.body.rewards.length > 0) {
        testRewardId = response.body.rewards[0].id;
      }
    });

    it('should redeem a reward successfully', async () => {
      if (!testRewardId) {
        pending('No test reward available');
        return;
      }

      const response = await request(app.getHttpServer())
        .post(`/api/v1/rewards/${testRewardId}/redeem`)
        // .set('Authorization', `Bearer ${authToken}`)
        .send({
          confirmation: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('redemption_id');
      expect(response.body).toHaveProperty('points_spent');
      expect(response.body).toHaveProperty('new_balance');
      expect(response.body).toHaveProperty('delivery_status');
      expect(response.body).toHaveProperty('confirmation_code');
      
      expect(typeof response.body.points_spent).toBe('number');
      expect(response.body.points_spent).toBeGreaterThan(0);
      expect(['pending', 'processing']).toContain(response.body.delivery_status);
    });

    it('should require confirmation', async () => {
      if (!testRewardId) {
        pending('No test reward available');
        return;
      }

      await request(app.getHttpServer())
        .post(`/api/v1/rewards/${testRewardId}/redeem`)
        // .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should return 404 for non-existent reward', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post(`/api/v1/rewards/${fakeId}/redeem`)
        // .set('Authorization', `Bearer ${authToken}`)
        .send({
          confirmation: true,
        })
        .expect(404);
    });

    it('should check sufficient point balance', async () => {
      // Get a very expensive reward
      const response = await request(app.getHttpServer())
        .get('/api/v1/rewards?min_points=10000')
        .expect(200);

      if (response.body.rewards.length > 0) {
        const expensiveRewardId = response.body.rewards[0].id;

        await request(app.getHttpServer())
          .post(`/api/v1/rewards/${expensiveRewardId}/redeem`)
          // .set('Authorization', `Bearer ${authToken}`)
          .send({
            confirmation: true,
          })
          .expect(400);
      }
    });

    it('should handle out-of-stock rewards', async () => {
      // TODO: Create a test reward with stock_quantity = 0
      // Then try to redeem it and expect 400 or 409
    });

    it('should deduct points from balance', async () => {
      if (!testRewardId) {
        pending('No test reward available');
        return;
      }

      // Get initial balance
      const initialResponse = await request(app.getHttpServer())
        .get('/api/v1/points/balance')
        // .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const initialBalance = initialResponse.body.balance;

      // Redeem reward
      const redeemResponse = await request(app.getHttpServer())
        .post(`/api/v1/rewards/${testRewardId}/redeem`)
        // .set('Authorization', `Bearer ${authToken}`)
        .send({
          confirmation: true,
        })
        .expect(200);

      const pointsSpent = redeemResponse.body.points_spent;

      // Check new balance
      const finalResponse = await request(app.getHttpServer())
        .get('/api/v1/points/balance')
        // .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalResponse.body.balance).toBe(initialBalance - pointsSpent);
    });

    it('should create transaction record for redemption', async () => {
      if (!testRewardId) {
        pending('No test reward available');
        return;
      }

      // Redeem reward
      const redeemResponse = await request(app.getHttpServer())
        .post(`/api/v1/rewards/${testRewardId}/redeem`)
        // .set('Authorization', `Bearer ${authToken}`)
        .send({
          confirmation: true,
        })
        .expect(200);

      // Check transaction history
      const historyResponse = await request(app.getHttpServer())
        .get('/api/v1/points/transactions?type=spend')
        // .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const redemptionTransaction = historyResponse.body.transactions[0];
      expect(redemptionTransaction.type).toBe('spend');
      expect(redemptionTransaction.source).toBe('redemption');
      expect(Math.abs(redemptionTransaction.amount)).toBe(redeemResponse.body.points_spent);
    });

    it('should generate unique confirmation codes', async () => {
      if (!testRewardId) {
        pending('No test reward available');
        return;
      }

      const response1 = await request(app.getHttpServer())
        .post(`/api/v1/rewards/${testRewardId}/redeem`)
        // .set('Authorization', `Bearer ${authToken}`)
        .send({ confirmation: true })
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .post(`/api/v1/rewards/${testRewardId}/redeem`)
        // .set('Authorization', `Bearer ${authToken}`)
        .send({ confirmation: true })
        .expect(200);

      expect(response1.body.confirmation_code).not.toBe(response2.body.confirmation_code);
    });
  });

  describe('Reward Availability', () => {
    it('should not show unavailable rewards', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/rewards')
        .expect(200);

      expect(response.body.rewards).toBeInstanceOf(Array);
      response.body.rewards.forEach((reward: any) => {
        expect(reward.availability_status).not.toBe('disabled');
      });
    });

    it('should show featured rewards', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/rewards?featured=true')
        .expect(200);

      expect(response.body.rewards).toBeInstanceOf(Array);
      response.body.rewards.forEach((reward: any) => {
        expect(reward.is_featured).toBe(true);
      });
    });
  });
});

