/**
 * Storage Quota Service (User Story 7)
 * T183: Service for enforcing storage quotas (1GB free, 5GB member, 20GB offline member)
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfflineGame } from '../entities/offline-game.entity';

export type MembershipTier = 'free' | 'member' | 'offline_member';

export interface StorageQuota {
  used: number;
  total: number;
  available: number;
  percentage_used: number;
  tier: MembershipTier;
}

@Injectable()
export class StorageQuotaService {
  // Storage quotas in bytes
  private readonly QUOTAS = {
    free: 1073741824, // 1GB
    member: 5368709120, // 5GB
    offline_member: 21474836480, // 20GB
  };

  constructor(
    @InjectRepository(OfflineGame)
    private readonly offlineGameRepository: Repository<OfflineGame>,
  ) {}

  /**
   * Get storage quota for a user
   */
  async getStorageQuota(userId: string, tier?: MembershipTier): Promise<StorageQuota> {
    const used = await this.getUsedStorage(userId);
    const effectiveTier: MembershipTier = tier || 'free';
    const total = this.QUOTAS[effectiveTier];
    const available = total - used;
    const percentage_used = (used / total) * 100;

    return {
      used,
      total,
      available,
      percentage_used: Math.min(100, percentage_used),
      tier: effectiveTier,
    };
  }

  /**
   * Check if user has enough quota for a file
   */
  async checkQuota(userId: string, fileSize: number, tier?: MembershipTier): Promise<boolean> {
    const used = await this.getUsedStorage(userId);
    const effectiveTier: MembershipTier = tier || 'free';
    const total = this.QUOTAS[effectiveTier];
    return (used + fileSize) <= total;
  }

  /**
   * Get used storage for a user
   */
  private async getUsedStorage(userId: string): Promise<number> {
    const result = await this.offlineGameRepository
      .createQueryBuilder('offline_game')
      .select('SUM(offline_game.file_size)', 'total')
      .where('offline_game.user_id = :userId', { userId })
      .andWhere('offline_game.download_status = :status', { status: 'completed' })
      .getRawOne();

    return parseInt(result?.total || '0', 10);
  }

  /**
   * Get quota tier based on membership
   */
  getTierQuota(tier: MembershipTier): number {
    return this.QUOTAS[tier];
  }
}

