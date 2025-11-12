import { Request, Response, NextFunction } from 'express'
import { DownloadStatus } from '../modules/downloads/entities/download.entity'
import { getDownloadRepositoryInstance, getUserRepositoryInstance, getGameRepositoryInstance } from '../repositories'
import { catchAsync, AppError } from '@/middleware'
import { getPaginationParams, formatPaginationResult } from '@/utils/pagination'
import fs from 'fs'
import path from 'path'

/**
 * 获取下载列表
 */
export const getDownloads = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, gameId, status } = req.query
  const pagination = getPaginationParams(req)
  const downloadRepository = getDownloadRepositoryInstance()

  // 构建过滤条件
  const filters: any = {}
  if (userId) filters.userId = userId as string
  if (gameId) filters.gameId = gameId as string
  if (status) filters.status = status as DownloadStatus

  // 执行查询
  const result = await downloadRepository.findDownloadsWithFilters(filters, pagination)

  res.status(200).json({
    status: 'success',
    data: result
  })
})

/**
 * 获取下载详情
 */
export const getDownloadById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const downloadRepository = getDownloadRepositoryInstance()

  const download = await downloadRepository.findById(id)
  
  if (!download) {
    return next(new AppError('下载记录不存在', 404))
  }

  res.status(200).json({
    status: 'success',
    data: {
      download
    }
  })
})

/**
 * 创建下载记录
 */
export const createDownload = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { gameId, userId } = req.body
  const downloadRepository = getDownloadRepositoryInstance()
  const gameRepository = getGameRepositoryInstance()
  const userRepository = getUserRepositoryInstance()

  // 检查游戏是否存在
  const game = await gameRepository.findById(gameId)
  if (!game) {
    return next(new AppError('游戏不存在', 404))
  }

  // 检查用户是否存在
  const user = await userRepository.findById(userId)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  // 检查是否已有相同游戏的下载记录
  const existingDownload = await downloadRepository.findActiveDownloadByUserAndGame(userId, gameId)

  if (existingDownload) {
    return next(new AppError('该游戏已在下载队列中或正在下载', 400))
  }

  // 创建下载记录
  const download = downloadRepository.create({
    userId,
    gameId,
    status: DownloadStatus.PENDING,
    progress: 0,
    downloadedSize: 0,
    fileSize: null
  })

  await downloadRepository.save(download)

  // 获取完整的下载记录信息
  const fullDownload = await downloadRepository.findById((download as any).id)

  res.status(201).json({
    status: 'success',
    message: '下载任务创建成功',
    data: {
      download: fullDownload
    }
  })
})

/**
 * 更新下载进度
 */
export const updateDownloadProgress = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const { progress, status, downloadedSize, downloadSpeed } = req.body
  const downloadRepository = getDownloadRepositoryInstance()

  const download = await downloadRepository.findById(id)
  if (!download) {
    return next(new AppError('下载记录不存在', 404))
  }

  // 更新下载进度
  if (progress !== undefined) {
    await downloadRepository.updateProgress(id, progress, downloadedSize, downloadSpeed)
  }

  // 更新状态
  if (status) {
    await downloadRepository.updateStatus(id, status)
  }

  // 获取更新后的下载记录
  const updatedDownload = await downloadRepository.findById(id)

  res.status(200).json({
    status: 'success',
    message: '下载进度更新成功',
    data: {
      download: updatedDownload
    }
  })
})

/**
 * 暂停下载
 */
export const pauseDownload = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const downloadRepository = getDownloadRepositoryInstance()

  const download = await downloadRepository.findById(id)
  if (!download) {
    return next(new AppError('下载记录不存在', 404))
  }

  if (download.status !== DownloadStatus.IN_PROGRESS) {
    return next(new AppError('只能暂停正在进行的下载', 400))
  }

  await downloadRepository.pauseDownload(id)
  const updatedDownload = await downloadRepository.findById(id)

  res.status(200).json({
    status: 'success',
    message: '下载已暂停',
    data: {
      download: updatedDownload
    }
  })
})

/**
 * 恢复下载
 */
export const resumeDownload = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const downloadRepository = getDownloadRepositoryInstance()

  const download = await downloadRepository.findById(id)
  if (!download) {
    return next(new AppError('下载记录不存在', 404))
  }

  if (download.status !== DownloadStatus.PAUSED) {
    return next(new AppError('只能恢复已暂停的下载', 400))
  }

  await downloadRepository.resumeDownload(id)
  const updatedDownload = await downloadRepository.findById(id)

  res.status(200).json({
    status: 'success',
    message: '下载已恢复',
    data: {
      download: updatedDownload
    }
  })
})

/**
 * 取消下载
 */
export const cancelDownload = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const downloadRepository = getDownloadRepositoryInstance()

  const download = await downloadRepository.findById(id)
  if (!download) {
    return next(new AppError('下载记录不存在', 404))
  }

  if ([DownloadStatus.COMPLETED, DownloadStatus.CANCELLED, DownloadStatus.FAILED].includes(download.status)) {
    return next(new AppError('无法取消已完成或已取消的下载', 400))
  }

  await downloadRepository.cancelDownload(id)
  const updatedDownload = await downloadRepository.findById(id)

  res.status(200).json({
    status: 'success',
    message: '下载已取消',
    data: {
      download: updatedDownload
    }
  })
})

/**
 * 重试下载
 */
export const retryDownload = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const downloadRepository = getDownloadRepositoryInstance()

  const download = await downloadRepository.findById(id)
  if (!download) {
    return next(new AppError('下载记录不存在', 404))
  }

  if (download.status !== DownloadStatus.FAILED) {
    return next(new AppError('只能重试失败的下载', 400))
  }

  await downloadRepository.retryDownload(id)
  const updatedDownload = await downloadRepository.findById(id)

  res.status(200).json({
    status: 'success',
    message: '下载已重试',
    data: {
      download: updatedDownload
    }
  })
})

/**
 * 删除下载记录
 */
export const deleteDownload = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const downloadRepository = getDownloadRepositoryInstance()

  const download = await downloadRepository.findById(id)
  if (!download) {
    return next(new AppError('下载记录不存在', 404))
  }

  // 如果下载正在进行，先取消
  if (download.status === DownloadStatus.IN_PROGRESS) {
    await downloadRepository.cancelDownload(id)
  }

  // 删除下载的文件（如果存在）
  // Note: filePath field does not exist in current Download entity
  // if (download.downloadUrl) {
  //   // Handle file deletion if needed
  // }

  // 删除下载记录
  await downloadRepository.remove(download)

  res.status(200).json({
    status: 'success',
    message: '下载记录删除成功'
  })
})

/**
 * 获取下载统计信息
 */
export const getDownloadStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, gameId, period } = req.query
  const downloadRepository = getDownloadRepositoryInstance()

  // 构建过滤条件
  const filters: any = {}
  if (userId) filters.userId = userId as string
  if (gameId) filters.gameId = gameId as string
  if (period) filters.period = period as 'today' | 'week' | 'month' | 'year'

  // 获取统计信息
  const stats = await downloadRepository.getDownloadStats(filters)

  const { totalDownloads, statusStats, totalDownloadedSize, avgDownloadSpeed } = stats

  res.status(200).json({
    status: 'success',
    data: {
      totalDownloads,
      statusStats,
      totalDownloadedSize,
      avgDownloadSpeed
    }
  })
})