/**
 * Points Controller
 * Handles HTTP requests for points and tasks
 * T076-T079: Implement points API endpoints
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PointService } from '../services/point.service';
import { PointTaskService } from '../services/point-task.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { TransactionType } from '../entities/point-transaction.entity';

@Controller('points')
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(
    private readonly pointService: PointService,
    private readonly taskService: PointTaskService,
  ) {}

  /**
   * T076: GET /points/balance - Get user point balance
   */
  @Get('balance')
  @HttpCode(HttpStatus.OK)
  async getBalance(@CurrentUser() user: any) {
    const userId = user.id || user.sub;
    return this.pointService.getBalance(userId);
  }

  /**
   * T077: GET /points/transactions - Get transaction history
   */
  @Get('transactions')
  @HttpCode(HttpStatus.OK)
  async getTransactions(
    @CurrentUser() user: any,
    @Query('type') type?: TransactionType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = user.id || user.sub;

    const { transactions, total } = await this.pointService.getTransactions(userId, {
      type,
      page: page ? parseInt(String(page)) : 1,
      limit: limit ? parseInt(String(limit)) : 20,
    });

    return {
      transactions: transactions.map((t) => t.toJSON()),
      pagination: {
        page: page || 1,
        limit: limit || 20,
        total,
        total_pages: Math.ceil(total / (limit || 20)),
      },
    };
  }

  /**
   * T078: GET /points/tasks - Get available tasks
   */
  @Get('tasks')
  @HttpCode(HttpStatus.OK)
  async getTasks(@CurrentUser() user: any) {
    const userId = user.id || user.sub;
    return this.taskService.getAvailableTasks(userId);
  }

  /**
   * T079: POST /points/tasks/{taskId}/complete - Complete a task
   */
  @Post('tasks/:taskId/complete')
  @HttpCode(HttpStatus.OK)
  async completeTask(
    @CurrentUser() user: any,
    @Param('taskId') taskId: string,
    @Body() data?: Record<string, any>,
  ) {
    const userId = user.id || user.sub;
    return this.taskService.completeTask(userId, taskId, data);
  }

  /**
   * Additional: Get user statistics
   */
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  async getStatistics(@CurrentUser() user: any) {
    const userId = user.id || user.sub;

    const [balance, totalEarned, totalSpent] = await Promise.all([
      this.pointService.getBalance(userId),
      this.pointService.getTotalEarned(userId),
      this.pointService.getTotalSpent(userId),
    ]);

    return {
      current_balance: balance.balance,
      pending: balance.pending,
      total_earned: totalEarned,
      total_spent: totalSpent,
    };
  }
}
