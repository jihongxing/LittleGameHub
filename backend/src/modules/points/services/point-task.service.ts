/**
 * Point Task Service
 * Manages point-earning tasks (daily check-in, ad watch, etc.)
 * T074: Implement point task system
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PointService } from './point.service';
import { PointCalculationService } from './point-calculation.service';

export interface PointTask {
  id: string;
  name: string;
  description: string;
  point_reward: number;
  is_completed: boolean;
  cooldown_until: Date | null;
  requirements?: Record<string, any>;
}

export interface CompleteTaskResponse {
  points_earned: number;
  new_balance: number;
  transaction_id: string;
}

@Injectable()
export class PointTaskService {
  private readonly logger = new Logger(PointTaskService.name);

  // Task definitions
  private readonly TASK_DEFINITIONS: Record<string, Partial<PointTask>> = {
    daily_checkin: {
      name: 'Daily Check-in',
      description: 'Check in daily to earn points',
      point_reward: 10,
    },
    watch_ad: {
      name: 'Watch Ad',
      description: 'Watch an advertisement to earn points',
      point_reward: 5,
    },
    invite_friend: {
      name: 'Invite Friend',
      description: 'Invite a friend to join',
      point_reward: 50,
    },
    play_game: {
      name: 'Play Game',
      description: 'Play any game for at least 3 minutes',
      point_reward: 20,
    },
  };

  constructor(
    private readonly pointService: PointService,
    private readonly calculationService: PointCalculationService,
  ) {}

  /**
   * Get available tasks for user
   */
  async getAvailableTasks(userId: string): Promise<{ tasks: PointTask[] }> {
    const tasks: PointTask[] = [];

    for (const [taskId, definition] of Object.entries(this.TASK_DEFINITIONS)) {
      const isCompleted = await this.isTaskCompletedToday(userId, taskId);
      const cooldownUntil = await this.getTaskCooldown(userId, taskId);

      tasks.push({
        id: taskId,
        name: definition.name!,
        description: definition.description!,
        point_reward: definition.point_reward!,
        is_completed: isCompleted,
        cooldown_until: cooldownUntil,
      });
    }

    return { tasks };
  }

  /**
   * Complete a task
   */
  async completeTask(
    userId: string,
    taskId: string,
    data?: Record<string, any>,
  ): Promise<CompleteTaskResponse> {
    // Validate task exists
    const taskDefinition = this.TASK_DEFINITIONS[taskId];
    if (!taskDefinition) {
      throw new BadRequestException(`Task ${taskId} not found`);
    }

    // Check if already completed today
    const isCompleted = await this.isTaskCompletedToday(userId, taskId);
    if (isCompleted) {
      throw new BadRequestException('Task already completed today');
    }

    // Check cooldown
    const cooldown = await this.getTaskCooldown(userId, taskId);
    if (cooldown && new Date() < cooldown) {
      throw new BadRequestException('Task is on cooldown');
    }

    // Validate task requirements
    await this.validateTaskRequirements(userId, taskId, data);

    // Calculate points
    let pointsEarned = taskDefinition.point_reward!;

    // Special handling for daily check-in (consecutive days bonus)
    if (taskId === 'daily_checkin') {
      const consecutiveDays = await this.getConsecutiveDays(userId);
      pointsEarned = this.calculationService.calculateDailyCheckInPoints(consecutiveDays);
    }

    // Award points
    const transaction = await this.pointService.awardPoints(
      userId,
      pointsEarned,
      `task_${taskId}`,
      undefined,
      `Completed task: ${taskDefinition.name}`,
    );

    // Get new balance
    const balance = await this.pointService.getBalance(userId);

    this.logger.log(`User ${userId} completed task ${taskId}, earned ${pointsEarned} points`);

    return {
      points_earned: pointsEarned,
      new_balance: balance.balance,
      transaction_id: transaction.id,
    };
  }

  /**
   * Check if task is completed today
   */
  private async isTaskCompletedToday(userId: string, taskId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sourceId = `${taskId}_${today.toISOString().split('T')[0]}`;
    return this.pointService.hasExistingTransaction(userId, `task_${taskId}`, sourceId);
  }

  /**
   * Get task cooldown
   */
  private async getTaskCooldown(userId: string, taskId: string): Promise<Date | null> {
    // Daily tasks reset at midnight
    if (taskId === 'daily_checkin' || taskId === 'play_game') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const isCompleted = await this.isTaskCompletedToday(userId, taskId);
      return isCompleted ? tomorrow : null;
    }

    // Ad watch has 5 minute cooldown
    if (taskId === 'watch_ad') {
      // TODO: Check last ad watch time
      return null;
    }

    return null;
  }

  /**
   * Validate task requirements
   */
  private async validateTaskRequirements(
    userId: string,
    taskId: string,
    data?: Record<string, any>,
  ): Promise<void> {
    if (taskId === 'watch_ad') {
      if (!data?.ad_id) {
        throw new BadRequestException('Ad ID is required');
      }
      // TODO: Verify ad was actually watched
    }

    if (taskId === 'invite_friend') {
      if (!data?.invitee_id) {
        throw new BadRequestException('Invitee ID is required');
      }
      // TODO: Verify invitation relationship
    }
  }

  /**
   * Get consecutive check-in days
   */
  private async getConsecutiveDays(userId: string): Promise<number> {
    // TODO: Implement consecutive day tracking
    // For now, return 0
    return 0;
  }
}
