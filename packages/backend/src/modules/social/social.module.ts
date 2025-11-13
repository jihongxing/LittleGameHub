/**
 * Social Module (User Story 6)
 * Module for social features including friends, leaderboards, and challenges
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entities
import { FriendRelationship } from './entities/friend-relationship.entity';
import { GameChallenge } from './entities/game-challenge.entity';
import { GameSession } from '../games/entities/game-session.entity';

// Services
import { FriendService } from './services/friend.service';
import { LeaderboardService } from './services/leaderboard.service';
import { GameChallengeService } from './services/game-challenge.service';

// Controllers
import { FriendsController } from './controllers/friends.controller';
import { LeaderboardsController } from './controllers/leaderboards.controller';

// Gateways
import { NotificationsGateway } from './gateways/notifications.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FriendRelationship,
      GameChallenge,
      GameSession,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    FriendService,
    LeaderboardService,
    GameChallengeService,
    NotificationsGateway,
  ],
  controllers: [
    FriendsController,
    LeaderboardsController,
  ],
  exports: [
    FriendService,
    LeaderboardService,
    GameChallengeService,
    NotificationsGateway,
  ],
})
export class SocialModule {}

