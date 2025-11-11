import { Request, Response, NextFunction } from 'express'
import { Download, Game, User } from '@/models'
import { catchAsync, AppError } from '@/middleware'
import { getPaginationParams, buildSequelizeQueryOptions, formatPaginationResult } from '@/utils/pagination'
import { Op } from 'sequelize'
import fs from 'fs'
import path from 'path'

/**
 * 获取下载列表
 */
export const getDownloads = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, gameId, status } = req.query
  const pagination = getPaginationParams(req)

  // 构建查询条件
  const where: any = {}

  // 用户ID过滤
  if (userId) {
    where.userId = userId
  }

  // 游戏ID过滤
  if (gameId) {
    where.gameId = gameId
  }

  // 状态过滤
  if (status) {
    where.status = status
  }

  // 构建查询选项
  const queryOptions = buildSequelizeQueryOptions(pagination, {
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'avatar']
      },
      {
        model: Game,
        as: 'game',
        attributes: ['id', 'title', 'coverImage', 'genre', 'platform', 'fileSize']
      }
    ],
    order: [['createdAt', 'DESC']]
  })

  // 执行查询
  const { count, rows } = await Download.findAndCountAll(queryOptions)

  // 格式化分页结果
  const result = formatPaginationResult(rows, count, pagination.page || 1, pagination.limit || 10)

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

  const download = await Download.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'avatar']
      },
      {
        model: Game,
        as: 'game'
      }
    ]
  })
  
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

  // 检查游戏是否存在
  const game = await Game.findByPk(gameId)
  if (!game) {
    return next(new AppError('游戏不存在', 404))
  }

  // 检查用户是否存在
  const user = await User.findByPk(userId)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  // 检查是否已有相同游戏的下载记录
  const existingDownload = await Download.findOne({
    where: {
      userId,
      gameId,
      status: { [Op.in]: ['pending', 'in_progress'] }
    }
  })

  if (existingDownload) {
    return next(new AppError('该游戏已在下载队列中或正在下载', 400))
  }

  // 创建下载记录
  const download = await Download.create({
    userId,
    gameId,
    status: 'pending',
    progress: 0,
    fileSize: game.fileSize,
    downloadUrl: game.downloadUrl
  })

  // 获取完整的下载记录信息
  const fullDownload = await Download.findByPk(download.id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'avatar']
      },
      {
        model: Game,
        as: 'game'
      }
    ]
  })

  res.status(201).json({
    status: 'success',
    message: '下载记录创建成功',
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

  const download = await Download.findByPk(id)
  if (!download) {
    return next(new AppError('下载记录不存在', 404))
  }

  // 更新下载信息
  if (progress !== undefined) download.progress = progress
  if (status) download.status = status
  if (downloadedSize !== undefined) download.downloadedSize = downloadedSize
  if (downloadSpeed !== undefined) download.downloadSpeed = downloadSpeed

  // 如果下载完成，设置完成时间
  if (status === 'completed') {
    download.completedAt = new Date()
  }

  await download.save()

  res.status(200).json({
    status: 'success',
    message: '下载进度更新成功',
    data: {
      download
    }
  })
})

/**
 * 暂停下载
 */
export const pauseDownload = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  const download = await Download.findByPk(id)
  if (!download) {
    return next(new AppError('下载记录不存在', 404))
  }

  if (download.status !== 'in_progress') {
    return next(new AppError('只能暂停正在进行的下载', 400))
  }

  download.status = 'paused'
  await download.save()

  res.status(200).json({
    status: 'success',
    message: '下载已暂停',
    data: {
      download
    }
  })
})

/**
 * 恢复下载
 */
export const resumeDownload = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  const download = await Download.findByPk(id)
  if (!download) {
    return next(new AppError('下载记录不存在', 404))
  }

  if (download.status !== 'paused') {
    return next(new AppError('只能恢复已暂停的下载', 400))
  }

  download.status = 'in_progress'
  await download.save()

  res.status(200).json({
    status: 'success',
    message: '下载已恢复',
    data: {
      download
    }
  })
})

/**
 * 取消下载
 */
export const cancelDownload = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  const download = await Download.findByPk(id)
  if (!download) {
    return next(new AppError('下载记录不存在', 404))
  }

  if (['completed', 'cancelled', 'failed'].includes(download.status)) {
    return next(new AppError('无法取消已完成或已取消的下载', 400))
  }

  download.status = 'cancelled'
  await download.save()

  res.status(200).json({
    status: 'success',
    message: '下载已取消',
    data: {
      download
    }
  })
})

/**
 * 重试下载
 */
export const retryDownload = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  const download = await Download.findByPk(id)
  if (!download) {
    return next(new AppError('下载记录不存在', 404))
  }

  if (download.status !== 'failed') {
    return next(new AppError('只能重试失败的下载', 400))
  }

  download.status = 'pending'
  download.progress = 0
  download.downloadedSize = 0
  download.downloadSpeed = 0
  download.errorMessage = null
  await download.save()

  res.status(200).json({
    status: 'success',
    message: '下载已重试',
    data: {
      download
    }
  })
})

/**
 * 删除下载记录
 */
export const deleteDownload = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  const download = await Download.findByPk(id)
  if (!download) {
    return next(new AppError('下载记录不存在', 404))
  }

  // 如果下载正在进行，先取消
  if (download.status === 'in_progress') {
    download.status = 'cancelled'
    await download.save()
  }

  // 删除下载的文件（如果存在）
  if (download.filePath && fs.existsSync(download.filePath)) {
    try {
      fs.unlinkSync(download.filePath)
    } catch (error) {
      console.error('删除下载文件失败:', error)
    }
  }

  // 删除下载记录
  await download.destroy()

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

  // 构建查询条件
  const where: any = {}

  // 用户ID过滤
  if (userId) {
    where.userId = userId
  }

  // 游戏ID过滤
  if (gameId) {
    where.gameId = gameId
  }

  // 时间范围过滤
  if (period) {
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
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 默认30天
    }

    where.createdAt = {
      [Op.gte]: startDate
    }
  }

  // 总下载数
  const totalDownloads = await Download.count({ where })

  // 各状态下载数
  const statusCounts = await Download.findAll({
    where,
    attributes: [
      'status',
      [Download.sequelize!.fn('COUNT', Download.sequelize!.col('id')), 'count']
    ],
    group: ['status']
  })

  const statusStats = statusCounts.reduce((acc: any, item: any) => {
    acc[item.status] = parseInt(item.dataValues.count)
    return acc
  }, {})

  // 总下载量（字节）
  const totalDownloadedSize = await Download.sum('downloadedSize', {
    where: { ...where, status: 'completed' }
  }) || 0

  // 平均下载速度（字节/秒）
  const avgDownloadSpeed = await Download.findOne({
    where: { ...where, status: 'completed', downloadSpeed: { [Op.gt]: 0 } },
    attributes: [
      [Download.sequelize!.fn('AVG', Download.sequelize!.col('downloadSpeed')), 'avgSpeed']
    ]
  })

  res.status(200).json({
    status: 'success',
    data: {
      totalDownloads,
      statusStats,
      totalDownloadedSize,
      avgDownloadSpeed: avgDownloadSpeed?.dataValues.avgSpeed || 0
    }
  })
})