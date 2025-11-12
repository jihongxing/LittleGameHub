# Database Migrations

This directory contains TypeORM database migrations for the GameHub platform.

## Migration Naming Convention

Migrations follow the format: `{timestamp}_{description}.ts`

Example: `001_create_users.ts`

## Running Migrations

```bash
# Run all pending migrations
npm run migrate:run

# Revert last migration
npm run migrate:revert

# Generate a new migration
npm run migrate:generate -- -n MigrationName

# Create an empty migration
npm run migrate:create -- -n MigrationName
```

## Migration Order

1. `001_create_users.ts` - User and UserAuthMethod tables
2. `002_create_games.ts` - Game and GameSession tables  
3. `003_create_points_rewards.ts` - PointTransaction, Reward, Redemption tables
4. `004_create_membership.ts` - Membership table
5. `005_create_invitations.ts` - Invitation table
6. `006_create_recommendations.ts` - Recommendation table
7. `007_create_social.ts` - FriendRelationship and GameChallenge tables
8. `008_create_collections_offline.ts` - GameCollection, CollectionItem, OfflineGame tables
9. `009_create_achievements.ts` - Achievement table

## Notes

- Always test migrations in development before deploying to production
- Use transactions in migrations to ensure atomicity
- Include both `up` and `down` methods for reversibility
- Document breaking changes in migration comments

