/**
 * Games Controller 游戏控制器
 * Handles HTTP requests for game catalog, details, and sessions 处理游戏目录、详情和会话的HTTP请求
 * T047-T050: Implement game API endpoints
 * T047-T050: 实现游戏API端点
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { GameService, GetGamesOptions } from '../services/game.service';
import { GameSessionService, UpdateSessionData } from '../services/game-session.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { GameAvailabilityStatus } from '../entities/game.entity';
import { GameSessionStatus } from '../entities/game-session.entity';

/**
 * DTOs for request validation 请求验证的数据传输对象
 */
/**
 * Get games query DTO 获取游戏查询DTO
 * Query parameters for game listing 游戏列表的查询参数
 */
class GetGamesQueryDto {
  category?: string; // 游戏分类 / Game category
  search?: string; // 搜索关键词 / Search keyword
  status?: GameAvailabilityStatus; // 可用状态 / Availability status
  page?: number; // 页码 / Page number
  limit?: number; // 每页限制 / Items per page limit
  sort?: 'popular' | 'latest' | 'rating'; // 排序方式 / Sort method
}

/**
 * Update session DTO 更新会话DTO
 * Data for updating a game session 更新游戏会话的数据
 */
class UpdateSessionDto {
  end_time?: string; // 结束时间 / End time
  duration_seconds?: number; // 持续秒数 / Duration in seconds
  completion_status?: GameSessionStatus; // 完成状态 / Completion status
  game_state?: Record<string, any>; // 游戏状态 / Game state
}

/**
 * Games Controller 游戏控制器
 * Handles HTTP requests for game-related operations 处理游戏相关操作的HTTP请求
 */
@Controller('games')
export class GamesController {
  constructor(
    private readonly gameService: GameService, // 游戏服务 / Game service
    private readonly gameSessionService: GameSessionService, // 游戏会话服务 / Game session service
  ) {}

  /**
   * T047: GET /games - Get game catalog with filtering and pagination
   * T047: GET /games - 获取带筛选和分页的游戏目录
   * @param query Query parameters 查询参数
   * @returns Paginated game list 分页游戏列表
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getGames(@Query() query: GetGamesQueryDto) {
    const options: GetGamesOptions = {
      category: query.category, // 游戏分类 / Game category
      search: query.search, // 搜索关键词 / Search keyword
      status: query.status, // 可用状态 / Availability status
      page: query.page ? parseInt(String(query.page)) : 1, // 页码，默认为1 / Page number, default 1
      limit: query.limit ? parseInt(String(query.limit)) : 20, // 每页限制，默认为20 / Limit per page, default 20
      sort: query.sort || 'popular', // 排序方式，默认为热门 / Sort method, default popular
    };

    // Validate page and limit 验证页码和限制
    if (options.page && options.page < 1) {
      throw new BadRequestException('Page must be >= 1'); // 页码必须大于等于1 / Page must be >= 1
    }

    if (options.limit && (options.limit < 1 || options.limit > 100)) {
      throw new BadRequestException('Limit must be between 1 and 100'); // 限制必须在1到100之间 / Limit must be between 1 and 100
    }

    const result = await this.gameService.getGames(options);

    return {
      games: result.games.map((game) => game.toJSON()), // 游戏列表，转换为JSON格式 / Game list, converted to JSON format
      pagination: result.pagination, // 分页信息 / Pagination info
    };
  }

  /**
   * T048: GET /games/{gameId} - Get game details
   * T048: GET /games/{gameId} - 获取游戏详情
   * @param gameId Game UUID 游戏唯一标识
   * @returns Game details 游戏详情
   */
  @Get(':gameId')
  @HttpCode(HttpStatus.OK)
  async getGameById(@Param('gameId', ParseUUIDPipe) gameId: string) {
    const game = await this.gameService.getGameById(gameId);
    return game.toJSON(); // 返回游戏JSON数据 / Return game JSON data
  }

  /**
   * T049: POST /games/{gameId}/sessions - Start a game session
   * T049: POST /games/{gameId}/sessions - 开始游戏会话
   * @param gameId Game UUID 游戏唯一标识
   * @param user Current user (from JWT) 当前用户（来自JWT）
   * @returns Session information 会话信息
   */
  @Post(':gameId/sessions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async startGameSession(
    @Param('gameId', ParseUUIDPipe) gameId: string,
    @CurrentUser() user: any, // TODO: Type with User entity // TODO: 使用用户实体类型 / TODO: Type with User entity
  ) {
    const userId = user.id || user.sub; // Handle different JWT payload formats // 处理不同的JWT载荷格式 / Handle different JWT payload formats
    return this.gameSessionService.startSession(userId, gameId); // 开始游戏会话 / Start game session
  }

  /**
   * T050: PATCH /games/{gameId}/sessions/{sessionId} - Update game session
   * T050: PATCH /games/{gameId}/sessions/{sessionId} - 更新游戏会话
   * @param gameId Game UUID 游戏唯一标识
   * @param sessionId Session UUID 会话唯一标识
   * @param updateData Session update data 会话更新数据
   * @param user Current user (from JWT) 当前用户（来自JWT）
   * @returns Updated session with points earned 更新后的会话及获得积分
   */
  @Patch(':gameId/sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateGameSession(
    @Param('gameId', ParseUUIDPipe) gameId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() updateData: UpdateSessionDto,
    @CurrentUser() user: any, // TODO: Type with User entity // TODO: 使用用户实体类型 / TODO: Type with User entity
  ) {
    const userId = user.id || user.sub; // 获取用户ID / Get user ID

    // Validate and convert update data 验证并转换更新数据
    const sessionUpdateData: UpdateSessionData = {
      completion_status: updateData.completion_status, // 完成状态 / Completion status
      game_state: updateData.game_state, // 游戏状态 / Game state
    };

    // Parse end_time if provided 如果提供了结束时间则解析
    if (updateData.end_time) {
      sessionUpdateData.end_time = new Date(updateData.end_time);
      
      // Validate date 验证日期
      if (isNaN(sessionUpdateData.end_time.getTime())) {
        throw new BadRequestException('Invalid end_time format'); // 结束时间格式无效 / Invalid end_time format
      }
    }

    // Validate duration_seconds 验证持续秒数
    if (updateData.duration_seconds !== undefined) {
      if (updateData.duration_seconds < 0) {
        throw new BadRequestException('duration_seconds must be >= 0'); // 持续秒数必须大于等于0 / duration_seconds must be >= 0
      }
      sessionUpdateData.duration_seconds = updateData.duration_seconds; // 设置持续秒数 / Set duration seconds
    }

    // Calculate duration from end_time if not provided 如果未提供则从结束时间计算持续秒数
    if (sessionUpdateData.end_time && !sessionUpdateData.duration_seconds) {
      const session = await this.gameSessionService.getSessionById(sessionId);
      const durationMs = sessionUpdateData.end_time.getTime() - session.startTime.getTime();
      sessionUpdateData.duration_seconds = Math.floor(durationMs / 1000); // 转换为秒 / Convert to seconds
    }

    return this.gameSessionService.updateSession(userId, gameId, sessionId, sessionUpdateData); // 更新会话 / Update session
  }

  /**
   * Additional endpoint: Get featured games
   * 附加端点：获取精选游戏
   * @param limit Number of games to return 返回游戏数量
   * @returns Array of featured games 精选游戏数组
   */
  @Get('featured/list')
  @HttpCode(HttpStatus.OK)
  async getFeaturedGames(@Query('limit') limit?: number) {
    const parsedLimit = limit ? parseInt(String(limit)) : 10; // 解析限制数量，默认为10 / Parse limit, default 10
    const games = await this.gameService.getFeaturedGames(parsedLimit);
    return {
      games: games.map((game) => game.toJSON()), // 游戏列表，转换为JSON格式 / Game list, converted to JSON format
    };
  }

  /**
   * Additional endpoint: Get games by category
   * 附加端点：按分类获取游戏
   * @param category Category name 分类名称
   * @param limit Number of games to return 返回游戏数量
   * @returns Array of games 游戏数组
   */
  @Get('categories/:category')
  @HttpCode(HttpStatus.OK)
  async getGamesByCategory(
    @Param('category') category: string,
    @Query('limit') limit?: number,
  ) {
    const parsedLimit = limit ? parseInt(String(limit)) : 20; // 解析限制数量，默认为20 / Parse limit, default 20
    const games = await this.gameService.getGamesByCategory(category, parsedLimit);
    return {
      games: games.map((game) => game.toJSON()), // 游戏列表，转换为JSON格式 / Game list, converted to JSON format
    };
  }

  /**
   * Additional endpoint: Get user's game sessions
   * 附加端点：获取用户的游戏会话
   * @param user Current user 当前用户
   * @param gameId Optional game ID filter 可选的游戏ID筛选
   * @param status Optional status filter 可选的状态筛选
   * @param limit Number of sessions to return 返回会话数量
   * @returns Array of sessions 会话数组
   */
  @Get('sessions/history')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUserSessions(
    @CurrentUser() user: any,
    @Query('game_id') gameId?: string,
    @Query('status') status?: GameSessionStatus,
    @Query('limit') limit?: number,
  ) {
    const userId = user.id || user.sub; // 获取用户ID / Get user ID
    const parsedLimit = limit ? parseInt(String(limit)) : 20; // 解析限制数量，默认为20 / Parse limit, default 20

    const sessions = await this.gameSessionService.getUserSessions(userId, {
      gameId, // 游戏ID / Game ID
      status, // 状态 / Status
      limit: parsedLimit, // 限制数量 / Limit count
    });

    return {
      sessions: sessions.map((session) => session.toJSON()), // 会话列表，转换为JSON格式 / Session list, converted to JSON format
    };
  }

  /**
   * Additional endpoint: Get active sessions
   * 附加端点：获取活跃会话
   * @param user Current user 当前用户
   * @returns Array of active sessions 活跃会话数组
   */
  @Get('sessions/active')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getActiveSessions(@CurrentUser() user: any) {
    const userId = user.id || user.sub; // 获取用户ID / Get user ID
    const sessions = await this.gameSessionService.getActiveSessions(userId);
    return {
      sessions: sessions.map((session) => session.toJSON()), // 活跃会话列表，转换为JSON格式 / Active session list, converted to JSON format
    };
  }

  /**
   * Additional endpoint: Get game statistics
   * 附加端点：获取游戏统计
   * @param gameId Game UUID 游戏唯一标识
   * @returns Game statistics 游戏统计信息
   */
  @Get(':gameId/statistics')
  @HttpCode(HttpStatus.OK)
  async getGameStatistics(@Param('gameId', ParseUUIDPipe) gameId: string) {
    const [gameStats, sessionStats] = await Promise.all([
      this.gameService.getGameStatistics(gameId), // 获取游戏统计 / Get game statistics
      this.gameSessionService.getGameSessionStats(gameId), // 获取会话统计 / Get session statistics
    ]);

    return {
      ...gameStats, // 合并游戏统计 / Merge game stats
      ...sessionStats, // 合并会话统计 / Merge session stats
    };
  }
}
