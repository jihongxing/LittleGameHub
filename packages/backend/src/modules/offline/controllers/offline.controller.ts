/**
 * Offline Games Controller (User Story 7)
 * T188-T190: API endpoints for offline game management
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { OfflineGameService } from '../services/offline-game.service';
import { StorageQuotaService } from '../services/storage-quota.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('offline')
@UseGuards(JwtAuthGuard)
export class OfflineController {
  constructor(
    private readonly offlineGameService: OfflineGameService,
    private readonly storageQuotaService: StorageQuotaService,
  ) {}

  /**
   * T188: GET /offline/games
   */
  @Get('games')
  async getOfflineGames(@Request() req, @Query('status') status?: string) {
    const userId = req.user.userId || req.user.sub;
    return await this.offlineGameService.getOfflineGames(userId, status as any);
  }

  /**
   * T189: POST /offline/games/:gameId/download
   */
  @Post('games/:gameId/download')
  @HttpCode(HttpStatus.CREATED)
  async downloadGame(@Request() req, @Param('gameId', ParseIntPipe) gameId: number) {
    const userId = req.user.userId || req.user.sub;
    
    // TODO: Get actual file size from game entity
    const fileSize = 10485760; // 10MB placeholder
    
    return await this.offlineGameService.downloadGame({
      user_id: userId,
      game_id: gameId,
      file_size: fileSize,
    });
  }

  /**
   * T190: DELETE /offline/games/:gameId
   */
  @Delete('games/:gameId')
  async deleteOfflineGame(@Request() req, @Param('gameId', ParseIntPipe) gameId: number) {
    const userId = req.user.userId || req.user.sub;
    await this.offlineGameService.deleteOfflineGame(gameId, userId);
    return { success: true, message: 'Offline game deleted' };
  }

  /**
   * GET /offline/games/:id/progress
   */
  @Get('games/:id/progress')
  async getDownloadProgress(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.userId || req.user.sub;
    return await this.offlineGameService.getDownloadProgress(id, userId);
  }

  /**
   * GET /offline/storage-quota
   */
  @Get('storage-quota')
  async getStorageQuota(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    // TODO: Get actual membership tier from user
    return await this.storageQuotaService.getStorageQuota(userId, 'free');
  }
}

