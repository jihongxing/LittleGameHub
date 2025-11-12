# Contributing to GameHub

Thank you for your interest in contributing to GameHub! This document provides guidelines and instructions for contributing.

---

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

### 1. Fork the Repository

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/LittleGameHub.git
cd LittleGameHub
```

### 2. Set Up Development Environment

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start development servers
npm run dev
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

---

## Code Style Guide

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow existing code patterns
- Use meaningful variable names
- Add JSDoc comments for public APIs

**Example**:
```typescript
/**
 * Calculate user points based on activity
 * @param userId - The user's ID
 * @param activityType - Type of activity completed
 * @returns The calculated points
 */
export function calculatePoints(userId: number, activityType: string): number {
  // Implementation
}
```

### Backend (NestJS)

- Use dependency injection
- Follow module-based architecture
- Implement proper error handling
- Add validation decorators

**Example**:
```typescript
@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
  ) {}

  async findAll(): Promise<Game[]> {
    return this.gameRepository.find();
  }
}
```

### Frontend (React)

- Use functional components with hooks
- Extract reusable logic into custom hooks
- Use TypeScript interfaces for props
- Follow component naming conventions

**Example**:
```typescript
interface GameCardProps {
  game: Game;
  onPlay: (gameId: number) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onPlay }) => {
  // Component implementation
};

export default GameCard;
```

---

## Git Workflow

### Commit Messages

Follow the Conventional Commits specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(achievements): add achievement unlock notification
fix(games): resolve game loading issue
docs(api): update API documentation
test(points): add points calculation tests
```

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

**Examples**:
```
feature/user-achievements
fix/game-session-timeout
docs/deployment-guide
refactor/points-service
test/membership-integration
```

---

## Testing Requirements

### Backend Tests

All new backend code must include:
- Unit tests for services
- Integration tests for controllers
- Minimum 80% code coverage

```bash
# Run tests
npm test

# Run with coverage
npm run test:cov

# Run specific test
npm test -- game.service.spec.ts
```

### Frontend Tests

All new frontend code must include:
- Component tests
- Hook tests (if applicable)
- Minimum 80% code coverage

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test GameCard.test.tsx
```

### E2E Tests

Critical user flows must have E2E tests:
```bash
# Run E2E tests
npm run test:e2e
```

---

## Pull Request Process

### 1. Before Submitting

- [ ] Run linters and fix errors
  ```bash
  npm run lint
  npm run lint:fix
  ```

- [ ] Run type checking
  ```bash
  npm run type-check
  ```

- [ ] Run all tests
  ```bash
  npm test
  ```

- [ ] Update documentation if needed

### 2. Create Pull Request

**Title**: Clear and descriptive
```
feat: Add achievement system notification component
```

**Description**: Include the following:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #123
```

### 3. Code Review Process

- At least one approval required
- All CI checks must pass
- Address review comments
- Resolve merge conflicts

### 4. After Approval

- Squash commits if needed
- Merge to main branch
- Delete feature branch

---

## Development Guidelines

### API Design

- Follow RESTful conventions
- Use proper HTTP methods
- Return appropriate status codes
- Include error messages

**Example**:
```typescript
@Get(':id')
async findOne(@Param('id') id: number): Promise<Game> {
  const game = await this.gameService.findOne(id);
  if (!game) {
    throw new NotFoundException(`Game with ID ${id} not found`);
  }
  return game;
}
```

### Database Migrations

- Create migrations for schema changes
- Test migrations in development
- Include rollback logic

```bash
# Create migration
npm run migration:create AddAchievementsTable

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

### Error Handling

- Use appropriate exception classes
- Provide helpful error messages
- Log errors with context

```typescript
try {
  await this.process();
} catch (error) {
  this.logger.error('Failed to process', error.stack);
  throw new InternalServerErrorException('Processing failed');
}
```

### Performance

- Optimize database queries
- Use caching where appropriate
- Implement pagination
- Monitor bundle size

---

## Documentation

### Code Documentation

- Add JSDoc comments to public APIs
- Document complex logic
- Include usage examples

### API Documentation

- Update API documentation in `docs/API.md`
- Include request/response examples
- Document error responses

### README Updates

- Keep README.md up to date
- Update setup instructions if changed
- Add new features to feature list

---

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Slack**: Real-time communication (if available)

### Getting Help

- Check existing documentation
- Search closed issues
- Ask in GitHub Discussions
- Contact maintainers

---

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Annual contributor report

---

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

## Questions?

If you have questions about contributing, please:
1. Check this guide
2. Review existing issues and PRs
3. Ask in GitHub Discussions
4. Contact maintainers

---

**Thank you for contributing to GameHub!** 🎉

---

**Version**: 1.0.0
**Last Updated**: 2024-11-12

