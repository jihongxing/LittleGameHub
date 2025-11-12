/**
 * Integration Tests for Collections (User Story 7)
 * T173, T174: Integration tests for collections endpoints
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameCollection } from '../../src/modules/collections/entities/game-collection.entity';
import { CollectionItem } from '../../src/modules/collections/entities/collection-item.entity';
import { User } from '../../src/modules/auth/entities/user.entity';

describe('Collections - Integration Tests', () => {
  let app: INestApplication;
  let collectionRepository: Repository<GameCollection>;
  let itemRepository: Repository<CollectionItem>;
  let userRepository: Repository<User>;
  let authToken: string;
  let testUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    collectionRepository = moduleFixture.get<Repository<GameCollection>>(
      getRepositoryToken(GameCollection),
    );
    itemRepository = moduleFixture.get<Repository<CollectionItem>>(
      getRepositoryToken(CollectionItem),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    // Create test user
    testUser = await userRepository.save({
      username: 'collection_test_user',
      email: 'collection_test@example.com',
      password: 'hashedPassword123',
    });

    // Generate auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: 'hashedPassword123' });
    
    authToken = loginResponse.body.access_token || 'mock_token_for_testing';
  });

  afterAll(async () => {
    // Clean up test data
    if (itemRepository) {
      await itemRepository.delete({});
    }
    if (collectionRepository) {
      await collectionRepository.delete({});
    }
    if (userRepository) {
      await userRepository.delete({});
    }
    await app.close();
  });

  describe('T173: GET /collections - Get user collections', () => {
    beforeEach(async () => {
      // Create test collections
      await collectionRepository.save([
        {
          user_id: testUser.id,
          name: 'Favorites',
          description: 'My favorite games',
          is_public: true,
        },
        {
          user_id: testUser.id,
          name: 'Action Games',
          description: 'Collection of action games',
          is_public: false,
        },
      ]);
    });

    afterEach(async () => {
      await itemRepository.delete({});
      await collectionRepository.delete({});
    });

    it('should return list of user collections', async () => {
      const response = await request(app.getHttpServer())
        .get('/collections')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('collections');
      expect(Array.isArray(response.body.collections)).toBe(true);
      expect(response.body.collections.length).toBeGreaterThanOrEqual(2);
      
      const collection = response.body.collections[0];
      expect(collection).toHaveProperty('id');
      expect(collection).toHaveProperty('name');
      expect(collection).toHaveProperty('description');
      expect(collection).toHaveProperty('is_public');
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/collections?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.collections).toHaveLength(1);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 1);
    });

    it('should filter by is_public', async () => {
      const response = await request(app.getHttpServer())
        .get('/collections?is_public=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.collections.every((c: any) => c.is_public === true)).toBe(true);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/collections')
        .expect(401);
    });

    it('should return empty array if user has no collections', async () => {
      await collectionRepository.delete({ user_id: testUser.id });

      const response = await request(app.getHttpServer())
        .get('/collections')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.collections).toEqual([]);
    });
  });

  describe('T174: POST /collections - Create collection', () => {
    afterEach(async () => {
      await itemRepository.delete({});
      await collectionRepository.delete({});
    });

    it('should create a new collection', async () => {
      const createDto = {
        name: 'My New Collection',
        description: 'A test collection',
        is_public: true,
      };

      const response = await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', createDto.name);
      expect(response.body).toHaveProperty('description', createDto.description);
      expect(response.body).toHaveProperty('is_public', createDto.is_public);
      expect(response.body).toHaveProperty('user_id', testUser.id);

      // Verify in database
      const savedCollection = await collectionRepository.findOne({
        where: { id: response.body.id },
      });
      expect(savedCollection).toBeDefined();
      expect(savedCollection?.name).toBe(createDto.name);
    });

    it('should create a private collection by default', async () => {
      const createDto = {
        name: 'Private Collection',
        description: 'This is private',
      };

      const response = await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('is_public', false);
    });

    it('should return 400 if name is missing', async () => {
      await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'No name' })
        .expect(400);
    });

    it('should return 400 if name is too long', async () => {
      await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'A'.repeat(101), // Exceeds max length
          description: 'Test',
        })
        .expect(400);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/collections')
        .send({ name: 'Test' })
        .expect(401);
    });

    it('should handle duplicate collection names for same user', async () => {
      const createDto = {
        name: 'Duplicate Test',
        description: 'First collection',
      };

      // Create first collection
      await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      // Try to create second collection with same name
      const response = await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto);

      // Should either succeed (allowing duplicates) or return 409 (conflict)
      expect([201, 409]).toContain(response.status);
    });
  });

  describe('POST /collections/:id/games - Add game to collection', () => {
    let collection: GameCollection;

    beforeEach(async () => {
      collection = await collectionRepository.save({
        user_id: testUser.id,
        name: 'Test Collection',
        description: 'For testing',
      });
    });

    afterEach(async () => {
      await itemRepository.delete({});
      await collectionRepository.delete({});
    });

    it('should add game to collection', async () => {
      const gameId = 1;

      const response = await request(app.getHttpServer())
        .post(`/collections/${collection.id}/games`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ game_id: gameId })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('collection_id', collection.id);
      expect(response.body).toHaveProperty('game_id', gameId);

      // Verify in database
      const savedItem = await itemRepository.findOne({
        where: { collection_id: collection.id, game_id: gameId },
      });
      expect(savedItem).toBeDefined();
    });

    it('should return 404 if collection not found', async () => {
      await request(app.getHttpServer())
        .post('/collections/999999/games')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ game_id: 1 })
        .expect(404);
    });

    it('should return 400 if game_id is missing', async () => {
      await request(app.getHttpServer())
        .post(`/collections/${collection.id}/games`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should return 409 if game already in collection', async () => {
      const gameId = 1;

      // Add game first time
      await request(app.getHttpServer())
        .post(`/collections/${collection.id}/games`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ game_id: gameId })
        .expect(201);

      // Try to add same game again
      await request(app.getHttpServer())
        .post(`/collections/${collection.id}/games`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ game_id: gameId })
        .expect(409);
    });
  });

  describe('DELETE /collections/:id - Delete collection', () => {
    it('should delete a collection', async () => {
      const collection = await collectionRepository.save({
        user_id: testUser.id,
        name: 'To Delete',
        description: 'Will be deleted',
      });

      await request(app.getHttpServer())
        .delete(`/collections/${collection.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      const deleted = await collectionRepository.findOne({
        where: { id: collection.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 if collection not found', async () => {
      await request(app.getHttpServer())
        .delete('/collections/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});

