/**
 * Achievements Integration Tests (User Story 8)
 * T202: Integration test for GET /achievements endpoint
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementsModule } from '../../src/modules/achievements/achievements.module';
import { Achievement } from '../../src/modules/achievements/entities/achievement.entity';

describe('Achievements API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USER || 'test',
          password: process.env.DB_PASSWORD || 'test',
          database: process.env.DB_NAME || 'test_db',
          entities: [Achievement],
          synchronize: true,
        }),
        AchievementsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /achievements', () => {
    it('should return list of all achievements', () => {
      return request(app.getHttpServer())
        .get('/achievements')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('achievements');
          expect(Array.isArray(res.body.achievements)).toBe(true);
        });
    });

    it('should return achievements with required properties', () => {
      return request(app.getHttpServer())
        .get('/achievements')
        .expect(200)
        .expect((res) => {
          const { achievements } = res.body;
          if (achievements.length > 0) {
            const achievement = achievements[0];
            expect(achievement).toHaveProperty('id');
            expect(achievement).toHaveProperty('title');
            expect(achievement).toHaveProperty('description');
            expect(achievement).toHaveProperty('category');
            expect(achievement).toHaveProperty('points_reward');
            expect(achievement).toHaveProperty('icon_url');
            expect(achievement).toHaveProperty('rarity');
          }
        });
    });
  });

  describe('GET /achievements/user/:userId', () => {
    it('should return user achievements with unlock status', () => {
      const userId = 1;
      return request(app.getHttpServer())
        .get(`/achievements/user/${userId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('achievements');
          expect(res.body).toHaveProperty('stats');
          expect(res.body.stats).toHaveProperty('total');
          expect(res.body.stats).toHaveProperty('unlocked');
          expect(res.body.stats).toHaveProperty('locked');
        });
    });
  });

  describe('GET /achievements/:id', () => {
    it('should return achievement details', async () => {
      // First get list to find an achievement ID
      const listRes = await request(app.getHttpServer())
        .get('/achievements')
        .expect(200);

      if (listRes.body.achievements.length > 0) {
        const achievementId = listRes.body.achievements[0].id;
        
        return request(app.getHttpServer())
          .get(`/achievements/${achievementId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('id', achievementId);
            expect(res.body).toHaveProperty('title');
            expect(res.body).toHaveProperty('description');
          });
      }
    });

    it('should return 404 for non-existent achievement', () => {
      return request(app.getHttpServer())
        .get('/achievements/99999')
        .expect(404);
    });
  });

  describe('POST /achievements/unlock', () => {
    it('should unlock achievement for user', () => {
      const userId = 1;
      const achievementId = 1;

      return request(app.getHttpServer())
        .post('/achievements/unlock')
        .send({
          user_id: userId,
          achievement_id: achievementId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('unlocked', true);
          expect(res.body).toHaveProperty('unlocked_at');
        });
    });

    it('should not unlock same achievement twice', async () => {
      const userId = 1;
      const achievementId = 1;

      // First unlock
      await request(app.getHttpServer())
        .post('/achievements/unlock')
        .send({ user_id: userId, achievement_id: achievementId })
        .expect(201);

      // Try to unlock again
      return request(app.getHttpServer())
        .post('/achievements/unlock')
        .send({ user_id: userId, achievement_id: achievementId })
        .expect(409); // Conflict
    });
  });
});

