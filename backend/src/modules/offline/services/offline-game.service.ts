/**
 * Offline Game Service (User Story 7)
 * T182: Service for managing offline game downloads and storage
 */

import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfflineGame, DownloadStatus } from '../entities/offline-game.entity';
import { StorageQuotaService } from './storage-quota.service';

export interface DownloadGameDto {
  user_id: number;
  game_id: number;
  file_size: number;
}

@Injectable()
export class OfflineGameService {
  constructor(
    @InjectRepository(OfflineGame)
    private readonly offlineGameRepository: Repository<OfflineGame>,
    private readonly storageQuotaService: StorageQuotaService,
  ) {}

  /**
   * Get all offline games for a user
   */
  async getOfflineGames(
    userId: number,
    status?: DownloadStatus,
  ): Promise<{ games: OfflineGame[]; storage: any }> {
    const queryBuilder = this.offlineGameRepository
      .createQueryBuilder('offline_game')
      .where('offline_game.user_id = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('offline_game.download_status = :status', { status });
    }

    queryBuilder.orderBy('offline_game.created_at', 'DESC');

    const games = await queryBuilder.getMany();
    const storage = await this.storageQuotaService.getStorageQuota(String(userId));

    return { games, storage };
  }

  /**
   * Initiate game download
   */
  async downloadGame(dto: DownloadGameDto): Promise<OfflineGame> {
    const { user_id, game_id, file_size } = dto;

    // Check if already downloaded
    const existing = await this.offlineGameRepository.findOne({
      where: { user_id, game_id },
    });

    if (existing) {
      throw new ConflictException('Game already downloaded or in progress');
    }

    // Check storage quota
    const hasSpace = await this.storageQuotaService.checkQuota(String(user_id), file_size);
    if (!hasSpace) {
      throw new BadRequestException('Insufficient storage quota');
    }

    // Create offline game record
    const offlineGame = this.offlineGameRepository.create({
      user_id,
      game_id,
      file_size,
      download_status: 'pending',
      download_started_at: new Date(),
    });

    return await this.offlineGameRepository.save(offlineGame);
  }

  /**
   * Update download progress
   */
  async updateDownloadProgress(
    id: number,
    downloadedBytes: number,
    status: DownloadStatus,
  ): Promise<OfflineGame> {
    const offlineGame = await this.offlineGameRepository.findOne({ where: { id } });

    if (!offlineGame) {
      throw new NotFoundException('Offline game not found');
    }

    offlineGame.downloaded_bytes = downloadedBytes;
    offlineGame.download_status = status;
    offlineGame.progress_percentage = offlineGame.file_size
      ? Math.floor((downloadedBytes / offlineGame.file_size) * 100)
      : 0;

    if (status === 'completed') {
      offlineGame.download_completed_at = new Date();
    }

    return await this.offlineGameRepository.save(offlineGame);
  }

  /**
   * Delete offline game
   */
  async deleteOfflineGame(gameId: number, userId: number): Promise<void> {
    const offlineGame = await this.offlineGameRepository.findOne({
      where: { user_id: userId, game_id: gameId },
    });

    if (!offlineGame) {
      throw new NotFoundException('Offline game not found');
    }

    await this.offlineGameRepository.remove(offlineGame);
  }

  /**
   * Get download progress
   */
  async getDownloadProgress(id: number, userId: number): Promise<OfflineGame> {
    const offlineGame = await this.offlineGameRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!offlineGame) {
      throw new NotFoundException('Offline game not found');
    }

    return offlineGame;
  }
}

