/**
 * Integration Tests for Membership API
 * Tests: T093, T094
 * 
 * Test Coverage:
 * - GET /membership - Get current membership status
 * - GET /membership/plans - Get available membership plans
 * - POST /membership/subscribe - Subscribe to membership plan
 */

import request from 'supertest';
import { app } from '../../src/app';

describe('Membership API Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Setup: Create test user and get auth token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        auth_method: 'email',
        identifier: 'membership-test@example.com',
        password: 'Test123456!',
        nickname: 'Membership Test User',
      });

    authToken = registerResponse.body.access_token;
    userId = registerResponse.body.user_id;
  });

  describe('GET /api/membership', () => {
    it('should return current membership status for free user', async () => {
      const response = await request(app)
        .get('/api/membership')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('membership_status');
      expect(response.body.membership_status).toBe('free');
      expect(response.body).not.toHaveProperty('expiration_date');
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get('/api/membership')
        .expect(401);
    });
  });

  describe('GET /api/membership/plans', () => {
    it('should return available membership plans', async () => {
      const response = await request(app)
        .get('/api/membership/plans')
        .expect(200);

      expect(response.body).toHaveProperty('plans');
      expect(Array.isArray(response.body.plans)).toBe(true);
      expect(response.body.plans.length).toBeGreaterThan(0);

      const plan = response.body.plans[0];
      expect(plan).toHaveProperty('plan_type');
      expect(plan).toHaveProperty('name');
      expect(plan).toHaveProperty('price');
      expect(plan).toHaveProperty('currency');
      expect(plan).toHaveProperty('duration_days');
      expect(plan).toHaveProperty('benefits');
      expect(Array.isArray(plan.benefits)).toBe(true);
    });

    it('should include all plan types', async () => {
      const response = await request(app)
        .get('/api/membership/plans')
        .expect(200);

      const planTypes = response.body.plans.map((p: any) => p.plan_type);
      expect(planTypes).toContain('monthly');
      expect(planTypes).toContain('quarterly');
      expect(planTypes).toContain('yearly');
    });
  });

  describe('POST /api/membership/subscribe', () => {
    it('should subscribe to monthly membership plan', async () => {
      const response = await request(app)
        .post('/api/membership/subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          plan_type: 'monthly',
          payment_method: 'wechat',
          payment_data: {
            mock_payment: true,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('membership_id');
      expect(response.body).toHaveProperty('payment_status');
      expect(response.body).toHaveProperty('payment_transaction_id');
      expect(['pending', 'paid']).toContain(response.body.payment_status);
    });

    it('should fail with invalid plan type', async () => {
      await request(app)
        .post('/api/membership/subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          plan_type: 'invalid_plan',
          payment_method: 'wechat',
        })
        .expect(400);
    });

    it('should fail with invalid payment method', async () => {
      await request(app)
        .post('/api/membership/subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          plan_type: 'monthly',
          payment_method: 'invalid_method',
        })
        .expect(400);
    });

    it('should fail if not authenticated', async () => {
      await request(app)
        .post('/api/membership/subscribe')
        .send({
          plan_type: 'monthly',
          payment_method: 'wechat',
        })
        .expect(401);
    });

    it('should prevent duplicate active subscriptions', async () => {
      // First subscription
      await request(app)
        .post('/api/membership/subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          plan_type: 'monthly',
          payment_method: 'wechat',
          payment_data: { mock_payment: true },
        })
        .expect(200);

      // Second subscription should fail
      await request(app)
        .post('/api/membership/subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          plan_type: 'yearly',
          payment_method: 'alipay',
          payment_data: { mock_payment: true },
        })
        .expect(409); // Conflict
    });
  });

  describe('Membership Status After Subscription', () => {
    it('should show active membership after successful payment', async () => {
      // Subscribe with mock payment
      const subscribeResponse = await request(app)
        .post('/api/membership/subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          plan_type: 'monthly',
          payment_method: 'wechat',
          payment_data: { mock_payment: true, auto_success: true },
        })
        .expect(200);

      // Check membership status
      const statusResponse = await request(app)
        .get('/api/membership')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (subscribeResponse.body.payment_status === 'paid') {
        expect(statusResponse.body.membership_status).toBe('member');
        expect(statusResponse.body).toHaveProperty('plan_type', 'monthly');
        expect(statusResponse.body).toHaveProperty('start_date');
        expect(statusResponse.body).toHaveProperty('expiration_date');
      }
    });
  });
});

