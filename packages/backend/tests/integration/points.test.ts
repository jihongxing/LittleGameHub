/**
 * Integration tests for Points API endpoints
 * User Story 2: Earn and Manage Points
 * 
 * Tests:
 * - T061: GET /points/balance endpoint
 * - T062: GET /points/transactions endpoint
 * - T063: POST /points/tasks/{taskId}/complete endpoint
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { GlobalValidationPipe } from '../../src/common/pipes/validation.pipe';

describe('Points API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;

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

  describe('GET /points/balance (T061)', () => {
    it('should return user point balance', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/points/balance')
        // .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('balance');
      expect(response.body).toHaveProperty('pending');
      expect(typeof response.body.balance).toBe('number');
      expect(typeof response.body.pending).toBe('number');
      expect(response.body.balance).toBeGreaterThanOrEqual(0);
      expect(response.body.pending).toBeGreaterThanOrEqual(0);
    });

    it('should return 401 without authentication', async () => {
      // TODO: Uncomment when auth is implemented
      // await request(app.getHttpServer())
      //   .get('/api/v1/points/balance')
      //   .expect(401);
    });
  });

  describe('GET /points/transactions (T062)', () => {
    it('should return transaction history with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/points/transactions')
        // .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.transactions)).toBe(true);

      if (response.body.transactions.length > 0) {
        const transaction = response.body.transactions[0];
        expect(transaction).toHaveProperty('id');
        expect(transaction).toHaveProperty('type');
        expect(transaction).toHaveProperty('amount');
        expect(transaction).toHaveProperty('source');
        expect(transaction).toHaveProperty('description');
        expect(transaction).toHaveProperty('balance_after');
        expect(transaction).toHaveProperty('created_at');
        expect(['earn', 'spend']).toContain(transaction.type);
      }
    });

    it('should filter transactions by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/points/transactions?type=earn')
        // .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.transactions).toBeInstanceOf(Array);
      response.body.transactions.forEach((transaction: any) => {
        expect(transaction.type).toBe('earn');
        expect(transaction.amount).toBeGreaterThan(0);
      });
    });

    it('should filter transactions by spend type', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/points/transactions?type=spend')
        // .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.transactions).toBeInstanceOf(Array);
      response.body.transactions.forEach((transaction: any) => {
        expect(transaction.type).toBe('spend');
        expect(transaction.amount).toBeLessThan(0);
      });
    });

    it('should paginate transactions correctly', async () => {
      const page1 = await request(app.getHttpServer())
        .get('/api/v1/points/transactions?page=1&limit=5')
        // .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(page1.body.transactions.length).toBeLessThanOrEqual(5);
      expect(page1.body.pagination.page).toBe(1);
      expect(page1.body.pagination.limit).toBe(5);
    });

    it('should sort transactions by date descending', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/points/transactions')
        // .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const transactions = response.body.transactions;
      if (transactions.length > 1) {
        for (let i = 0; i < transactions.length - 1; i++) {
          const date1 = new Date(transactions[i].created_at);
          const date2 = new Date(transactions[i + 1].created_at);
          expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
        }
      }
    });
  });

  describe('GET /points/tasks (T063 part 1)', () => {
    it('should return available point tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/points/tasks')
        // .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(Array.isArray(response.body.tasks)).toBe(true);

      if (response.body.tasks.length > 0) {
        const task = response.body.tasks[0];
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('name');
        expect(task).toHaveProperty('description');
        expect(task).toHaveProperty('point_reward');
        expect(task).toHaveProperty('is_completed');
        expect(typeof task.point_reward).toBe('number');
        expect(task.point_reward).toBeGreaterThan(0);
      }
    });

    it('should include daily check-in task', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/points/tasks')
        // .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const tasks = response.body.tasks;
      const dailyCheckIn = tasks.find((t: any) => t.id === 'daily_checkin');
      
      if (dailyCheckIn) {
        expect(dailyCheckIn.name).toBe('Daily Check-in');
        expect(dailyCheckIn.point_reward).toBeGreaterThan(0);
      }
    });
  });

  describe('POST /points/tasks/{taskId}/complete (T063 part 2)', () => {
    it('should complete a task and award points', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/points/tasks/daily_checkin/complete')
        // .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('points_earned');
      expect(response.body).toHaveProperty('new_balance');
      expect(response.body).toHaveProperty('transaction_id');
      expect(typeof response.body.points_earned).toBe('number');
      expect(response.body.points_earned).toBeGreaterThan(0);
    });

    it('should prevent completing the same task twice on same day', async () => {
      // Complete once
      await request(app.getHttpServer())
        .post('/api/v1/points/tasks/daily_checkin/complete')
        // .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      // Try again immediately
      await request(app.getHttpServer())
        .post('/api/v1/points/tasks/daily_checkin/complete')
        // .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should return 404 for non-existent task', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/points/tasks/non_existent_task/complete')
        // .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(404);
    });

    it('should validate task completion requirements', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/points/tasks/watch_ad/complete')
        // .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required ad_id
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should track task completion in transaction history', async () => {
      // Complete a task
      const completeResponse = await request(app.getHttpServer())
        .post('/api/v1/points/tasks/daily_checkin/complete')
        // .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      const transactionId = completeResponse.body.transaction_id;

      // Check transaction history
      const historyResponse = await request(app.getHttpServer())
        .get('/api/v1/points/transactions')
        // .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const transaction = historyResponse.body.transactions.find(
        (t: any) => t.id === transactionId
      );

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe('earn');
      expect(transaction.source).toContain('task');
    });
  });

  describe('Point Balance Updates', () => {
    it('should update balance after earning points', async () => {
      // Get initial balance
      const initialResponse = await request(app.getHttpServer())
        .get('/api/v1/points/balance')
        // .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const initialBalance = initialResponse.body.balance;

      // Earn points
      const earnResponse = await request(app.getHttpServer())
        .post('/api/v1/points/tasks/daily_checkin/complete')
        // .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      const pointsEarned = earnResponse.body.points_earned;

      // Check new balance
      const finalResponse = await request(app.getHttpServer())
        .get('/api/v1/points/balance')
        // .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalResponse.body.balance).toBe(initialBalance + pointsEarned);
    });

    it('should maintain accurate balance across multiple transactions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/points/transactions')
        // .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const transactions = response.body.transactions;
      
      if (transactions.length > 0) {
        // Most recent transaction should match current balance
        const balanceResponse = await request(app.getHttpServer())
          .get('/api/v1/points/balance')
          // .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(balanceResponse.body.balance).toBe(transactions[0].balance_after);
      }
    });
  });
});

