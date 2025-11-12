# Testing Guide

## Testing Standards (Phase 11 - T224-T230)

### Requirements
- **Backend Coverage**: ≥ 80% for business logic
- **Frontend Coverage**: ≥ 80% for business logic
- **Test Types**: Unit, Integration, Component, E2E

---

## Backend Testing

### Unit Tests (T226)

#### Service Tests
```typescript
// backend/tests/unit/game.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GameService } from '@/modules/games/services/game.service';
import { Game } from '@/modules/games/entities/game.entity';

describe('GameService', () => {
  let service: GameService;
  let repository: any;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: getRepositoryToken(Game),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    repository = module.get(getRepositoryToken(Game));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of games', async () => {
      const games = [{ id: 1, title: 'Test Game' }];
      mockRepository.find.mockResolvedValue(games);

      const result = await service.findAll();

      expect(result).toEqual(games);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a game by id', async () => {
      const game = { id: 1, title: 'Test Game' };
      mockRepository.findOne.mockResolvedValue(game);

      const result = await service.findById(1);

      expect(result).toEqual(game);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException when game not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow('Game not found');
    });
  });
});
```

### Integration Tests (T228)

```typescript
// backend/tests/integration/games.test.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamesModule } from '@/modules/games/games.module';

describe('Games API (e2e)', () => {
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
          entities: ['./**/*.entity.ts'],
          synchronize: true,
        }),
        GamesModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /games', () => {
    it('should return list of games', () => {
      return request(app.getHttpServer())
        .get('/games')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('games');
          expect(Array.isArray(res.body.games)).toBe(true);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/games?page=1&limit=10')
        .expect(200)
        .expect((res) => {
          expect(res.body.games.length).toBeLessThanOrEqual(10);
        });
    });
  });

  describe('GET /games/:id', () => {
    it('should return game details', async () => {
      // First get a game from the list
      const listRes = await request(app.getHttpServer()).get('/games');
      const gameId = listRes.body.games[0].id;

      return request(app.getHttpServer())
        .get(`/games/${gameId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', gameId);
          expect(res.body).toHaveProperty('title');
        });
    });

    it('should return 404 for non-existent game', () => {
      return request(app.getHttpServer())
        .get('/games/99999')
        .expect(404);
    });
  });
});
```

---

## Frontend Testing

### Component Tests (T229)

```typescript
// frontend/tests/component/GameCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GameCard from '@/components/business/GameCard';

const mockGame = {
  id: 1,
  title: 'Test Game',
  description: 'Test description',
  cover_image_url: 'https://example.com/cover.jpg',
  category_tags: ['action', 'adventure'],
  average_rating: 4.5,
  play_count: 1000,
};

describe('GameCard', () => {
  it('renders game information', () => {
    render(
      <BrowserRouter>
        <GameCard game={mockGame} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('displays game cover image', () => {
    render(
      <BrowserRouter>
        <GameCard game={mockGame} />
      </BrowserRouter>
    );

    const image = screen.getByAltText('Test Game');
    expect(image).toHaveAttribute('src', mockGame.cover_image_url);
  });

  it('calls onPlay when play button is clicked', () => {
    const onPlay = vi.fn();

    render(
      <BrowserRouter>
        <GameCard game={mockGame} onPlay={onPlay} />
      </BrowserRouter>
    );

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    expect(onPlay).toHaveBeenCalledWith(mockGame.id);
  });

  it('shows category tags', () => {
    render(
      <BrowserRouter>
        <GameCard game={mockGame} />
      </BrowserRouter>
    );

    expect(screen.getByText('action')).toBeInTheDocument();
    expect(screen.getByText('adventure')).toBeInTheDocument();
  });
});
```

### Hook Tests

```typescript
// frontend/tests/hooks/useStorageQuota.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useStorageQuota } from '@/hooks/useStorageQuota';
import * as offlineApi from '@/services/api/offline';

vi.mock('@/services/api/offline');

describe('useStorageQuota', () => {
  it('should fetch storage quota on mount', async () => {
    const mockQuota = {
      tier: 'free',
      total: 1073741824,
      used: 536870912,
      available: 536870912,
      percentage_used: 50,
    };

    vi.mocked(offlineApi.getOfflineGames).mockResolvedValue({
      games: [],
      storage: mockQuota,
    });

    const { result } = renderHook(() => useStorageQuota());

    await waitFor(() => {
      expect(result.current.quota).toEqual(mockQuota);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should calculate if file can be downloaded', async () => {
    const mockQuota = {
      tier: 'free',
      total: 1073741824,
      used: 536870912,
      available: 536870912,
      percentage_used: 50,
    };

    vi.mocked(offlineApi.getOfflineGames).mockResolvedValue({
      games: [],
      storage: mockQuota,
    });

    const { result } = renderHook(() => useStorageQuota());

    await waitFor(() => {
      expect(result.current.canDownload(100000000)).toBe(true); // 100MB
      expect(result.current.canDownload(600000000)).toBe(false); // 600MB
    });
  });
});
```

### E2E Tests (T230)

```typescript
// frontend/tests/e2e/game-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('user can browse and play a game', async ({ page }) => {
    // Navigate to games page
    await page.click('text=Games');
    await expect(page).toHaveURL(/.*games/);

    // Wait for games to load
    await page.waitForSelector('.game-card');

    // Click on first game
    await page.click('.game-card:first-child');
    await expect(page).toHaveURL(/.*games\/\d+/);

    // Check game details loaded
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.game-description')).toBeVisible();

    // Click play button
    await page.click('button:has-text("立即游玩")');
    await expect(page).toHaveURL(/.*games\/\d+\/play/);

    // Verify game player loaded
    await expect(page.locator('.game-player')).toBeVisible();
  });

  test('user can view achievements', async ({ page }) => {
    // Navigate to achievements
    await page.click('text=Achievements');
    await expect(page).toHaveURL(/.*achievements/);

    // Check achievements loaded
    await expect(page.locator('.achievement-card')).toHaveCount.toBeGreaterThan(0);

    // Filter by category
    await page.click('button:has-text("游戏")');
    await expect(page.locator('.achievement-card')).toBeVisible();
  });
});
```

---

## Test Coverage (T224, T225)

### Check Coverage

```bash
# Backend
cd backend
npm run test:cov

# Frontend
cd frontend
npm run test:coverage
```

### Coverage Requirements

| Type | Minimum Coverage |
|------|-----------------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

---

## Test Utilities

### Mock Data Factory

```typescript
// tests/factories/game.factory.ts
export class GameFactory {
  static create(overrides?: Partial<Game>): Game {
    return {
      id: 1,
      title: 'Test Game',
      description: 'Test description',
      game_url: 'https://example.com/game',
      cover_image_url: 'https://example.com/cover.jpg',
      category_tags: ['action'],
      average_rating: 4.5,
      play_count: 100,
      ...overrides,
    };
  }

  static createMany(count: number): Game[] {
    return Array.from({ length: count }, (_, i) => 
      GameFactory.create({ id: i + 1, title: `Game ${i + 1}` })
    );
  }
}
```

### Test Database Setup

```typescript
// tests/setup/database.ts
import { DataSource } from 'typeorm';

export async function setupTestDatabase(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'test',
    password: 'test',
    database: 'test_db',
    entities: ['src/**/*.entity.ts'],
    synchronize: true,
  });

  await dataSource.initialize();
  return dataSource;
}

export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;

  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.clear();
  }
}
```

---

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd backend && npm ci
      - name: Run tests
        run: cd backend && npm run test:cov
      - name: Upload coverage
        uses: codecov/codecov-action@v2

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Run tests
        run: cd frontend && npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v2

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - name: Install dependencies
        run: npm ci
      - name: Run E2E tests
        run: npm run test:e2e
```

---

## Best Practices

### Testing Principles
1. **Arrange-Act-Assert**: Structure tests clearly
2. **One Assertion**: Focus on one thing per test
3. **Descriptive Names**: Use clear test names
4. **Isolated Tests**: No dependencies between tests
5. **Fast Tests**: Keep tests quick
6. **Deterministic**: Same result every time

### What to Test
- ✅ Business logic
- ✅ Edge cases
- ✅ Error handling
- ✅ API contracts
- ✅ User interactions
- ❌ Framework code
- ❌ Third-party libraries

---

**Last Updated**: 2024-11-12
**Status**: In Progress

