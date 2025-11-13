/**
 * Download Repository
 * 下载仓库
 * 
 * 封装所有下载相关的数据库操作
 */

import { Repository, In } from 'typeorm'
import { Download, DownloadStatus } from '../modules/downloads/entities/download.entity'
import { BaseRepository, PaginationParams, PaginationResult } from './base.repository'
import { AppDataSource } from '../config/database.config'

/**
 * 下载查询过滤条件
 */
export interface DownloadFilter {
  userId?: string
  gameId?: string
  status?: DownloadStatus | DownloadStatus[]
  period?: 'today' | 'week' | 'month' | 'year'
}

/**
 * 下载统计信息
 */
export interface DownloadStats {
  totalDownloads: number
  statusStats: Record<string, number>
  totalDownloadedSize: number
  avgDownloadSpeed: number
}

/**
 * 下载仓库类
 */
export class DownloadRepository extends BaseRepository<Download> {
  constructor(repository?: Repository<Download>) {
    super(repository || AppDataSource.getRepository(Download))
  }

  /**
   * 获取下载列表（带过滤和分页）
   */
  async findDownloadsWithFilters(
    filters: DownloadFilter,
    pagination: PaginationParams
  ): Promise<PaginationResult<Download>> {
    const queryBuilder = this.repository
      .createQueryBuilder('download')
      .leftJoinAndSelect('download.user', 'user')
      .leftJoinAndSelect('download.game', 'game')

    // 用户ID过滤
    if (filters.userId) {
      queryBuilder.andWhere('download.user_id = :userId', { userId: filters.userId })
    }

    // 游戏ID过滤
    if (filters.gameId) {
      queryBuilder.andWhere('download.game_id = :gameId', { gameId: filters.gameId })
    }

    // 状态过滤
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        queryBuilder.andWhere('download.status IN (:...statuses)', { statuses: filters.status })
      } else {
        queryBuilder.andWhere('download.status = :status', { status: filters.status })
      }
    }

    // 时间范围过滤
    if (filters.period) {
      const startDate = this.getStartDateForPeriod(filters.period)
      queryBuilder.andWhere('download.created_at >= :startDate', { startDate })
    }

    // 分页
    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const skip = (page - 1) * limit

    queryBuilder.orderBy('download.created_at', 'DESC').skip(skip).take(limit)

    const [data, total] = await queryBuilder.getManyAndCount()

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * 查找用户正在下载或待下载的游戏
   */
  async findActiveDownloadByUserAndGame(
    userId: string,
    gameId: string
  ): Promise<Download | null> {
    return await this.repository.findOne({
      where: {
        userId,
        gameId,
        status: In([DownloadStatus.PENDING, DownloadStatus.IN_PROGRESS])
      }
    })
  }

  /**
   * 获取用户的下载记录
   */
  async findUserDownloads(
    userId: string,
    filters: Partial<DownloadFilter>,
    pagination: PaginationParams
  ): Promise<PaginationResult<Download>> {
    return await this.findDownloadsWithFilters(
      { ...filters, userId },
      pagination
    )
  }

  /**
   * 获取游戏的下载记录
   */
  async findGameDownloads(
    gameId: string,
    pagination: PaginationParams
  ): Promise<PaginationResult<Download>> {
    return await this.findDownloadsWithFilters(
      { gameId },
      pagination
    )
  }

  /**
   * 更新下载进度
   */
  async updateProgress(
    downloadId: string,
    progress: number,
    downloadedSize?: number,
    downloadSpeed?: number
  ): Promise<void> {
    const updateData: any = { progress }
    
    if (downloadedSize !== undefined) {
      updateData.downloadedSize = downloadedSize
    }
    
    if (downloadSpeed !== undefined) {
      updateData.downloadSpeed = downloadSpeed
    }

    await this.repository.update({ id: downloadId }, updateData)
  }

  /**
   * 更新下载状态
   */
  async updateStatus(downloadId: string, status: DownloadStatus): Promise<void> {
    const updateData: any = { status }

    // 如果状态为已完成，设置完成时间
    if (status === DownloadStatus.COMPLETED) {
      updateData.completedAt = new Date()
    }

    await this.repository.update({ id: downloadId }, updateData)
  }

  /**
   * 暂停下载
   */
  async pauseDownload(downloadId: string): Promise<void> {
    await this.updateStatus(downloadId, DownloadStatus.PAUSED)
  }

  /**
   * 恢复下载
   */
  async resumeDownload(downloadId: string): Promise<void> {
    await this.updateStatus(downloadId, DownloadStatus.IN_PROGRESS)
  }

  /**
   * 取消下载
   */
  async cancelDownload(downloadId: string): Promise<void> {
    await this.updateStatus(downloadId, DownloadStatus.CANCELLED)
  }

  /**
   * 标记下载失败
   */
  async failDownload(downloadId: string, errorMessage?: string): Promise<void> {
    await this.repository.update(
      { id: downloadId },
      {
        status: DownloadStatus.FAILED,
        errorMessage: errorMessage || null
      }
    )
  }

  /**
   * 重试下载
   */
  async retryDownload(downloadId: string): Promise<void> {
    await this.repository.update(
      { id: downloadId },
      {
        status: DownloadStatus.PENDING,
        progress: 0,
        downloadedSize: 0,
        downloadSpeed: 0,
        errorMessage: null
      }
    )
  }

  /**
   * 更新下载URL
   */
  async updateDownloadUrl(downloadId: string, downloadUrl: string): Promise<void> {
    await this.repository.update({ id: downloadId }, { downloadUrl })
  }

  /**
   * 获取下载统计信息
   */
  async getDownloadStats(filters: DownloadFilter): Promise<DownloadStats> {
    const queryBuilder = this.repository.createQueryBuilder('download')

    // 用户ID过滤
    if (filters.userId) {
      queryBuilder.andWhere('download.user_id = :userId', { userId: filters.userId })
    }

    // 游戏ID过滤
    if (filters.gameId) {
      queryBuilder.andWhere('download.game_id = :gameId', { gameId: filters.gameId })
    }

    // 时间范围过滤
    if (filters.period) {
      const startDate = this.getStartDateForPeriod(filters.period)
      queryBuilder.andWhere('download.created_at >= :startDate', { startDate })
    }

    // 总下载数
    const totalDownloads = await queryBuilder.getCount()

    // 各状态下载数
    const statusCounts = await this.repository
      .createQueryBuilder('download')
      .select('download.status', 'status')
      .addSelect('COUNT(download.id)', 'count')
      .groupBy('download.status')
      .getRawMany()

    const statusStats: Record<string, number> = {}
    statusCounts.forEach((item: any) => {
      statusStats[item.status] = parseInt(item.count)
    })

    // 总下载量（字节）
    const totalSizeResult = await this.repository
      .createQueryBuilder('download')
      .select('SUM(download.downloaded_size)', 'total')
      .where('download.status = :status', { status: DownloadStatus.COMPLETED })
      .getRawOne()

    const totalDownloadedSize = totalSizeResult?.total || 0

    // 平均下载速度（字节/秒）
    const avgSpeedResult = await this.repository
      .createQueryBuilder('download')
      .select('AVG(download.download_speed)', 'avgSpeed')
      .where('download.status = :status', { status: DownloadStatus.COMPLETED })
      .andWhere('download.download_speed > 0')
      .getRawOne()

    const avgDownloadSpeed = avgSpeedResult?.avgSpeed || 0

    return {
      totalDownloads,
      statusStats,
      totalDownloadedSize,
      avgDownloadSpeed
    }
  }

  /**
   * 获取用户的下载数量（按状态）
   */
  async countUserDownloadsByStatus(userId: string, status?: DownloadStatus): Promise<number> {
    const where: any = { userId }
    if (status) {
      where.status = status
    }
    return await this.repository.count({ where })
  }

  /**
   * 根据时间段获取开始日期
   */
  private getStartDateForPeriod(period: 'today' | 'week' | 'month' | 'year'): Date {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    return startDate
  }
}

// 导出单例实例
let downloadRepositoryInstance: DownloadRepository | null = null

export const getDownloadRepositoryInstance = (): DownloadRepository => {
  if (!downloadRepositoryInstance) {
    downloadRepositoryInstance = new DownloadRepository()
  }
  return downloadRepositoryInstance
}

