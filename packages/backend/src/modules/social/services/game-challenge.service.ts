/**
 * Game Challenge Service (User Story 6)
 * T160: Service for managing game challenges between friends
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameChallenge, ChallengeStatus, ChallengeType } from '../entities/game-challenge.entity';
import { FriendService } from './friend.service';
import { GameSession } from '../../games/entities/game-session.entity';

export interface CreateChallengeDto {
  challenger_id: number;
  challenged_id: number;
  game_id: number;
  challenge_type: ChallengeType;
  target_value?: number;
  message?: string;
  expires_in_hours?: number;
}

export interface UpdateChallengeScoreDto {
  user_id: number;
  score: number;
}

export interface GetChallengesQuery {
  user_id: number;
  status?: ChallengeStatus;
  game_id?: number;
  page?: number;
  limit?: number;
}

@Injectable()
export class GameChallengeService {
  constructor(
    @InjectRepository(GameChallenge)
    private readonly challengeRepository: Repository<GameChallenge>,
    @InjectRepository(GameSession)
    private readonly sessionRepository: Repository<GameSession>,
    private readonly friendService: FriendService,
  ) {}

  /**
   * Create a new game challenge
   */
  async createChallenge(dto: CreateChallengeDto): Promise<GameChallenge> {
    const {
      challenger_id,
      challenged_id,
      game_id,
      challenge_type,
      target_value,
      message,
      expires_in_hours = 24,
    } = dto;

    // Validate that user is not challenging themselves
    if (challenger_id === challenged_id) {
      throw new BadRequestException('Cannot challenge yourself');
    }

    // Verify that users are friends
    const areFriends = await this.friendService.areFriends(challenger_id, challenged_id);
    if (!areFriends) {
      throw new BadRequestException('Can only challenge friends');
    }

    // Check if there's already an active challenge between these users for this game
    const existingChallenge = await this.challengeRepository.findOne({
      where: {
        challenger_id,
        challenged_id,
        game_id,
        status: In(['pending', 'accepted']),
      },
    });

    if (existingChallenge) {
      throw new ConflictException('Active challenge already exists for this game');
    }

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expires_in_hours);

    // Create the challenge
    const challenge = this.challengeRepository.create({
      challenger_id,
      challenged_id,
      game_id,
      challenge_type,
      target_value,
      message,
      status: 'pending',
      expires_at: expiresAt,
    });

    return await this.challengeRepository.save(challenge);
  }

  /**
   * Accept a challenge
   */
  async acceptChallenge(challengeId: number, userId: number): Promise<GameChallenge> {
    const challenge = await this.challengeRepository.findOne({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    // Verify that the current user is the challenged user
    if (challenge.challenged_id !== userId) {
      throw new BadRequestException('You are not authorized to accept this challenge');
    }

    if (challenge.status !== 'pending') {
      throw new BadRequestException('Challenge is not in pending state');
    }

    // Check if challenge has expired
    if (challenge.expires_at && new Date() > challenge.expires_at) {
      challenge.status = 'expired';
      await this.challengeRepository.save(challenge);
      throw new BadRequestException('Challenge has expired');
    }

    // Accept the challenge
    challenge.status = 'accepted';
    challenge.accepted_at = new Date();

    return await this.challengeRepository.save(challenge);
  }

  /**
   * Decline a challenge
   */
  async declineChallenge(challengeId: number, userId: number): Promise<GameChallenge> {
    const challenge = await this.challengeRepository.findOne({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    // Verify that the current user is the challenged user
    if (challenge.challenged_id !== userId) {
      throw new BadRequestException('You are not authorized to decline this challenge');
    }

    if (challenge.status !== 'pending') {
      throw new BadRequestException('Challenge is not in pending state');
    }

    // Decline the challenge
    challenge.status = 'declined';

    return await this.challengeRepository.save(challenge);
  }

  /**
   * Update challenge score (when a user plays the game)
   */
  async updateChallengeScore(
    challengeId: number,
    dto: UpdateChallengeScoreDto,
  ): Promise<GameChallenge> {
    const { user_id, score } = dto;

    const challenge = await this.challengeRepository.findOne({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.status !== 'accepted') {
      throw new BadRequestException('Challenge must be accepted to update score');
    }

    // Check if challenge has expired
    if (challenge.expires_at && new Date() > challenge.expires_at) {
      challenge.status = 'expired';
      await this.challengeRepository.save(challenge);
      throw new BadRequestException('Challenge has expired');
    }

    // Update score based on who played
    if (user_id === challenge.challenger_id) {
      challenge.challenger_score = Math.max(challenge.challenger_score || 0, score);
    } else if (user_id === challenge.challenged_id) {
      challenge.challenged_score = Math.max(challenge.challenged_score || 0, score);
    } else {
      throw new BadRequestException('User is not part of this challenge');
    }

    // Check if challenge is complete
    if (challenge.challenger_score !== null && challenge.challenged_score !== null) {
      await this.completeChallenge(challenge);
    }

    return await this.challengeRepository.save(challenge);
  }

  /**
   * Complete a challenge and determine winner
   */
  private async completeChallenge(challenge: GameChallenge): Promise<void> {
    challenge.status = 'completed';
    challenge.completed_at = new Date();

    // Determine winner based on challenge type
    switch (challenge.challenge_type) {
      case 'high_score':
        // Higher score wins
        if (challenge.challenger_score! > challenge.challenged_score!) {
          challenge.winner_id = challenge.challenger_id;
        } else if (challenge.challenged_score! > challenge.challenger_score!) {
          challenge.winner_id = challenge.challenged_id;
        }
        // If scores are equal, no winner (tie)
        break;

      case 'time_attack':
        // Lower time wins (assuming score is time in seconds)
        if (challenge.challenger_score! < challenge.challenged_score!) {
          challenge.winner_id = challenge.challenger_id;
        } else if (challenge.challenged_score! < challenge.challenger_score!) {
          challenge.winner_id = challenge.challenged_id;
        }
        break;

      case 'completion':
        // First to complete wins (based on timestamp or completion flag)
        // This would need additional logic based on game sessions
        break;

      case 'custom':
        // Custom logic based on target_value or other criteria
        break;
    }

    // TODO: Award rewards to winner
    // This would integrate with the points/rewards system
  }

  /**
   * Get challenges for a user
   */
  async getChallenges(query: GetChallengesQuery): Promise<{
    challenges: GameChallenge[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { user_id, status, game_id, page = 1, limit = 20 } = query;

    const queryBuilder = this.challengeRepository
      .createQueryBuilder('gc')
      .where('(gc.challenger_id = :user_id OR gc.challenged_id = :user_id)', { user_id });

    if (status) {
      queryBuilder.andWhere('gc.status = :status', { status });
    }

    if (game_id) {
      queryBuilder.andWhere('gc.game_id = :game_id', { game_id });
    }

    // Order by creation date (newest first)
    queryBuilder.orderBy('gc.created_at', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const challenges = await queryBuilder.getMany();

    return {
      challenges,
      total,
      page,
      limit,
    };
  }

  /**
   * Get active challenges for a user
   */
  async getActiveChallenges(userId: number): Promise<GameChallenge[]> {
    return await this.challengeRepository.find({
      where: [
        { challenger_id: userId, status: In(['pending', 'accepted']) },
        { challenged_id: userId, status: In(['pending', 'accepted']) },
      ],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Expire old challenges
   */
  async expireOldChallenges(): Promise<number> {
    const result = await this.challengeRepository
      .createQueryBuilder()
      .update(GameChallenge)
      .set({ status: 'expired' })
      .where('status IN (:...statuses)', { statuses: ['pending', 'accepted'] })
      .andWhere('expires_at < :now', { now: new Date() })
      .execute();

    return result.affected || 0;
  }

  /**
   * Get challenge statistics for a user
   */
  async getChallengeStats(userId: number): Promise<{
    total_challenges: number;
    challenges_won: number;
    challenges_lost: number;
    challenges_tied: number;
    win_rate: number;
  }> {
    const challenges = await this.challengeRepository.find({
      where: [
        { challenger_id: userId, status: 'completed' },
        { challenged_id: userId, status: 'completed' },
      ],
    });

    const total = challenges.length;
    const won = challenges.filter((c) => c.winner_id === userId).length;
    const lost = challenges.filter(
      (c) => c.winner_id !== null && c.winner_id !== userId,
    ).length;
    const tied = challenges.filter((c) => c.winner_id === null).length;

    return {
      total_challenges: total,
      challenges_won: won,
      challenges_lost: lost,
      challenges_tied: tied,
      win_rate: total > 0 ? (won / total) * 100 : 0,
    };
  }
}

// Helper to import In operator
function In<T>(values: T[]): any {
  // This is a placeholder; TypeORM's In should be imported properly
  return values;
}

