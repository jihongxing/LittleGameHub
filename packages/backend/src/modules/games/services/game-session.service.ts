/**
 * Game Session Service 游戏会话服务
 * Handles game session creation, updates, and tracking 处理游戏会话创建、更新和跟踪
 * T046: Implement GameSessionService for session management
 * T046: 实现会话管理的GameSessionService
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameSession, GameSessionStatus } from '../entities/game-session.entity';
import { GameService } from './game.service';
import { Game } from '../entities/game.entity';

/**
 * Start session response interface 开始会话响应接口
 * Response data when starting a new game session 开始新游戏会话时的响应数据
 */
export interface StartSessionResponse {
  session_id: string; // 会话ID / Session ID
  game_id: string; // 游戏ID / Game ID
  start_time: string; // 开始时间 / Start time
}

/**
 * Update session data interface 更新会话数据接口
 * Data for updating an existing game session 更新现有游戏会话的数据
 */
export interface UpdateSessionData {
  end_time?: Date; // 结束时间 / End time
  duration_seconds?: number; // 持续秒数 / Duration in seconds
  completion_status?: GameSessionStatus; // 完成状态 / Completion status
  game_state?: Record<string, any>; // 游戏状态 / Game state
}

/**
 * End session response interface 结束会话响应接口
 * Response data when ending a game session 结束游戏会话时的响应数据
 */
export interface EndSessionResponse {
  session_id: string; // 会话ID / Session ID
  points_earned: number; // 获得积分 / Points earned
  new_balance: number; // 新余额 / New balance
}

/**
 * Game Session Service 游戏会话服务类
 * Manages game sessions and user gameplay tracking 管理游戏会话和用户游戏跟踪
 */
@Injectable()
export class GameSessionService {
  private readonly logger = new Logger(GameSessionService.name); // 日志记录器 / Logger

  constructor(
    @InjectRepository(GameSession)
    private readonly sessionRepository: Repository<GameSession>, // 会话数据仓库 / Session repository
    private readonly gameService: GameService, // 游戏服务 / Game service
  ) {}

  /**
   * Start a new game session
   * 开始新游戏会话
   * @param userId User UUID 用户唯一标识
   * @param gameId Game UUID 游戏唯一标识
   * @returns Session information 会话信息
   * @throws NotFoundException if game not found 如果游戏未找到则抛出异常
   * @throws BadRequestException if game not playable 如果游戏不可玩则抛出异常
   */
  async startSession(userId: string, gameId: string): Promise<StartSessionResponse> {
    // Verify game exists and is playable 验证游戏存在且可玩
    const game = await this.gameService.getGameById(gameId);

    if (!game.isPlayable()) {
      throw new BadRequestException(
        `Game ${gameId} is not available. Status: ${game.availabilityStatus}`
      ); // 游戏不可用则抛出异常 / Throw exception if game not available
    }

    // Create new session 创建新会话
    const session = this.sessionRepository.create({
      userId,
      gameId,
      startTime: new Date(),
      endTime: null,
      durationSeconds: null,
      pointsEarned: 0,
      completionStatus: GameSessionStatus.IN_PROGRESS,
      gameState: null,
    });

    await this.sessionRepository.save(session);

    // Increment game play count 增加游戏游玩次数
    await this.gameService.incrementPlayCount(gameId);

    this.logger.log(`Started game session ${session.id} for user ${userId}, game ${gameId}`); // 记录会话开始日志 / Log session start

    return {
      session_id: session.id, // 会话ID / Session ID
      game_id: gameId, // 游戏ID / Game ID
      start_time: session.startTime.toISOString(), // 开始时间ISO字符串 / Start time ISO string
    };
  }

  /**
   * Update game session
   * 更新游戏会话
   * @param userId User UUID 用户唯一标识
   * @param gameId Game UUID 游戏唯一标识
   * @param sessionId Session UUID 会话唯一标识
   * @param updateData Update data 更新数据
   * @returns Updated session with points earned 更新后的会话及获得积分
   */
  async updateSession(
    userId: string,
    gameId: string,
    sessionId: string,
    updateData: UpdateSessionData,
  ): Promise<EndSessionResponse> {
    // Get session 获取会话
    const session = await this.getSessionById(sessionId);

    // Verify ownership 验证所有权
    if (session.userId !== userId || session.gameId !== gameId) {
      throw new NotFoundException('Session not found or access denied'); // 会话未找到或访问被拒绝 / Session not found or access denied
    }

    // Verify session is still active 验证会话仍活跃
    if (!session.isActive()) {
      throw new BadRequestException('Session is already ended'); // 会话已结束 / Session already ended
    }

    // Update session fields 更新会话字段
    if (updateData.end_time) {
      session.endSession(updateData.end_time, updateData.completion_status); // 结束会话 / End session
    }

    if (updateData.game_state) {
      session.updateGameState(updateData.game_state); // 更新游戏状态 / Update game state
    }

    if (updateData.completion_status) {
      session.completionStatus = updateData.completion_status; // 更新完成状态 / Update completion status
    }

    // Calculate points if session is completed 如果会话完成则计算积分
    let pointsEarned = 0; // 获得积分 / Points earned
    let newBalance = 0; // TODO: Get from user service // 新余额 / New balance

    if (session.completionStatus === GameSessionStatus.COMPLETED && session.durationSeconds) {
      const game = await this.gameService.getGameById(gameId);

      // TODO: Get membership multiplier from user // TODO: 从用户获取会员倍数
      const membershipMultiplier = 1.0; // 会员倍数 / Membership multiplier

      pointsEarned = game.calculatePoints(session.durationSeconds, membershipMultiplier); // 计算积分 / Calculate points
      session.awardPoints(pointsEarned); // 奖励积分 / Award points

      // TODO: Award points to user via PointService // TODO: 通过积分服务给用户奖励积分
      // newBalance = await this.pointService.awardPoints(userId, pointsEarned, 'game_play', sessionId);

      this.logger.log(
        `Session ${sessionId}: Duration ${session.durationSeconds}s, Points ${pointsEarned}`
      ); // 记录会话统计日志 / Log session stats
    }

    await this.sessionRepository.save(session);

    return {
      session_id: sessionId, // 会话ID / Session ID
      points_earned: pointsEarned, // 获得积分 / Points earned
      new_balance: newBalance, // 新余额 / New balance
    };
  }

  /**
   * Get session by ID
   * 根据ID获取会话
   * @param sessionId Session UUID 会话唯一标识
   * @returns Game session 游戏会话
   * @throws NotFoundException if session not found 如果会话未找到则抛出异常
   */
  async getSessionById(sessionId: string): Promise<GameSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['game', 'user'],
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`); // 会话未找到则抛出异常 / Throw exception if session not found
    }

    return session;
  }

  /**
   * Get user's game sessions
   * 获取用户的游戏会话
   * @param userId User UUID 用户唯一标识
   * @param options Query options 查询选项
   * @returns Array of sessions 会话数组
   */
  async getUserSessions(
    userId: string,
    options: {
      gameId?: string;
      status?: GameSessionStatus;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<GameSession[]> {
    const query = this.sessionRepository
      .createQueryBuilder('session')
      .where('session.user_id = :userId', { userId })
      .orderBy('session.start_time', 'DESC'); // 按开始时间降序 / Order by start time DESC

    if (options.gameId) {
      query.andWhere('session.game_id = :gameId', { gameId: options.gameId }); // 按游戏ID筛选 / Filter by game ID
    }

    if (options.status) {
      query.andWhere('session.completion_status = :status', { status: options.status }); // 按状态筛选 / Filter by status
    }

    if (options.limit) {
      query.take(options.limit); // 限制数量 / Limit count
    }

    if (options.offset) {
      query.skip(options.offset); // 跳过数量 / Skip count
    }

    return query.getMany();
  }

  /**
   * Get active sessions for a user
   * 获取用户的活跃会话
   * @param userId User UUID 用户唯一标识
   * @returns Array of active sessions 活跃会话数组
   */
  async getActiveSessions(userId: string): Promise<GameSession[]> {
    return this.sessionRepository.find({
      where: {
        userId,
        completionStatus: GameSessionStatus.IN_PROGRESS,
      },
      relations: ['game'],
      order: {
        startTime: 'DESC',
      },
    });
  }

  /**
   * Get user's session history for a specific game
   * 获取用户在特定游戏中的会话历史
   * @param userId User UUID 用户唯一标识
   * @param gameId Game UUID 游戏唯一标识
   * @param limit Number of sessions to return 返回会话数量
   * @returns Array of sessions 会话数组
   */
  async getUserGameHistory(
    userId: string,
    gameId: string,
    limit: number = 10,
  ): Promise<GameSession[]> {
    return this.sessionRepository.find({
      where: {
        userId,
        gameId,
      },
      order: {
        startTime: 'DESC',
      },
      take: limit,
    });
  }

  /**
   * Get session statistics for a game
   * 获取游戏的会话统计
   * @param gameId Game UUID 游戏唯一标识
   * @returns Session statistics 会话统计信息
   */
  async getGameSessionStats(gameId: string): Promise<{
    total_sessions: number;
    active_sessions: number;
    completed_sessions: number;
    abandoned_sessions: number;
    average_duration_seconds: number;
    total_points_earned: number;
  }> {
    const [totalSessions, activeSessions, completedSessions, abandonedSessions] =
      await Promise.all([
        this.sessionRepository.count({ where: { gameId } }), // 总会话数 / Total sessions
        this.sessionRepository.count({
          where: { gameId, completionStatus: GameSessionStatus.IN_PROGRESS }, // 活跃会话数 / Active sessions
        }),
        this.sessionRepository.count({
          where: { gameId, completionStatus: GameSessionStatus.COMPLETED }, // 完成会话数 / Completed sessions
        }),
        this.sessionRepository.count({
          where: { gameId, completionStatus: GameSessionStatus.ABANDONED }, // 放弃会话数 / Abandoned sessions
        }),
      ]);

    // Calculate average duration and total points 计算平均时长和总积分
    const stats = await this.sessionRepository
      .createQueryBuilder('session')
      .select('AVG(session.duration_seconds)', 'avg_duration') // 平均时长 / Average duration
      .addSelect('SUM(session.points_earned)', 'total_points') // 总积分 / Total points
      .where('session.game_id = :gameId', { gameId })
      .andWhere('session.completion_status = :status', {
        status: GameSessionStatus.COMPLETED, // 已完成状态 / Completed status
      })
      .getRawOne();

    return {
      total_sessions: totalSessions, // 总会话数 / Total sessions
      active_sessions: activeSessions, // 活跃会话数 / Active sessions
      completed_sessions: completedSessions, // 完成会话数 / Completed sessions
      abandoned_sessions: abandonedSessions, // 放弃会话数 / Abandoned sessions
      average_duration_seconds: parseInt(stats?.avg_duration || 0), // 平均时长秒数 / Average duration seconds
      total_points_earned: parseInt(stats?.total_points || 0), // 总获得积分 / Total points earned
    };
  }

  /**
   * Abandon inactive sessions (cleanup job)
   * 放弃非活跃会话（清理任务）
   * @param inactiveThresholdMinutes Minutes of inactivity before abandoning 放弃前的非活跃分钟数
   * @returns Number of sessions abandoned 放弃的会话数量
   */
  async abandonInactiveSessions(inactiveThresholdMinutes: number = 30): Promise<number> {
    const thresholdTime = new Date();
    thresholdTime.setMinutes(thresholdTime.getMinutes() - inactiveThresholdMinutes); // 设置时间阈值 / Set time threshold

    const result = await this.sessionRepository
      .createQueryBuilder()
      .update(GameSession)
      .set({
        completionStatus: GameSessionStatus.ABANDONED, // 设置为放弃状态 / Set to abandoned status
        endTime: new Date(), // 设置结束时间 / Set end time
      })
      .where('completion_status = :status', { status: GameSessionStatus.IN_PROGRESS }) // 进行中状态 / In progress status
      .andWhere('start_time < :threshold', { threshold: thresholdTime }) // 早于阈值时间 / Before threshold time
      .execute();

    this.logger.log(`Abandoned ${result.affected} inactive sessions`); // 记录清理日志 / Log cleanup
    return result.affected || 0;
  }

  /**
   * Get user's total play time
   * 获取用户的总游戏时间
   * @param userId User UUID 用户唯一标识
   * @returns Total play time in seconds 总游戏时间（秒）
   */
  async getUserTotalPlayTime(userId: string): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder('session')
      .select('SUM(session.duration_seconds)', 'total_duration')
      .where('session.user_id = :userId', { userId })
      .andWhere('session.completion_status = :status', {
        status: GameSessionStatus.COMPLETED,
      })
      .getRawOne();

    return parseInt(result?.total_duration || 0);
  }

  /**
   * Get user's total points earned from games
   * 获取用户从游戏中获得的总积分
   * @param userId User UUID 用户唯一标识
   * @returns Total points earned 总获得积分
   */
  async getUserTotalPointsEarned(userId: string): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder('session')
      .select('SUM(session.points_earned)', 'total_points')
      .where('session.user_id = :userId', { userId })
      .getRawOne();

    return parseInt(result?.total_points || 0); // 返回总积分 / Return total points
  }
}
