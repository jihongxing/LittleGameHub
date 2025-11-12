import { Request, Response, NextFunction } from 'express'
import { GameAvailabilityStatus } from '../modules/games/entities/game.entity'
import { getGameRepositoryInstance } from '../repositories'
import { catchAsync, AppError } from '@/middleware'
import { getPaginationParams, formatPaginationResult } from '@/utils/pagination'

/**
 * 获取游戏列表
 */
export const getGames = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { q, genre, platform, isFree, isFeatured } = req.query
  const pagination = getPaginationParams(req)
  const gameRepository = getGameRepositoryInstance()

  // 构建过滤条件
  const filters: any = {
    availabilityStatus: GameAvailabilityStatus.ACTIVE
  }

  if (q) filters.q = q as string
  if (genre) filters.genre = genre
  if (platform) filters.platform = platform
  if (isFree !== undefined) filters.isFree = isFree === 'true'
  if (isFeatured !== undefined) filters.isFeatured = isFeatured === 'true'

  // 执行查询
  const result = await gameRepository.findGamesWithFilters(filters, pagination)

  // 格式化响应以匹配前端期望的格式
  res.status(200).json({
    status: 'success',
    data: {
      games: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        total_pages: result.totalPages
      }
    }
  })
})

/**
 * 获取游戏详情
 */
export const getGameById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const gameRepository = getGameRepositoryInstance()

  const game = await gameRepository.findActiveById(id)
  
  if (!game) {
    return next(new AppError('游戏不存在', 404))
  }

  res.status(200).json({
    status: 'success',
    data: {
      game
    }
  })
})

/**
 * 创建游戏
 */
export const createGame = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const {
    title,
    description,
    shortDescription,
    genre,
    platform,
    releaseDate,
    developer,
    publisher,
    version,
    size,
    coverImage,
    screenshots,
    trailerUrl,
    downloadUrl,
    price,
    isFree,
    systemRequirements,
    tags
  } = req.body
  
  const gameRepository = getGameRepositoryInstance()

  const game = gameRepository.create({
    title,
    description,
    coverImageUrl: coverImage,
    gameUrl: downloadUrl,
    categoryTags: tags || [],
    pointRewardRules: {
      base_points: 10,
      min_duration_seconds: 180,
      points_per_minute: 2,
      max_points_per_session: 100
    },
    minPlayDurationSeconds: 180,
    availabilityStatus: GameAvailabilityStatus.ACTIVE,
    isFeatured: false,
    version: version || '1.0.0',
    developerId: null
  })

  await gameRepository.save(game)

  res.status(201).json({
    status: 'success',
    message: '游戏创建成功',
    data: {
      game
    }
  })
})

/**
 * 更新游戏
 */
export const updateGame = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const updateData = req.body
  const gameRepository = getGameRepositoryInstance()

  const game = await gameRepository.findById(id)
  if (!game) {
    return next(new AppError('游戏不存在', 404))
  }

  Object.assign(game, updateData)
  await gameRepository.save(game)

  res.status(200).json({
    status: 'success',
    message: '游戏更新成功',
    data: {
      game
    }
  })
})

/**
 * 删除游戏
 */
export const deleteGame = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const gameRepository = getGameRepositoryInstance()

  const game = await gameRepository.findById(id)
  if (!game) {
    return next(new AppError('游戏不存在', 404))
  }

  // 软删除：设置为不活跃
  await gameRepository.softDeleteGame(id)

  res.status(200).json({
    status: 'success',
    message: '游戏删除成功'
  })
})

/**
 * 获取精选游戏
 */
export const getFeaturedGames = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const pagination = getPaginationParams(req)
  const gameRepository = getGameRepositoryInstance()

  // 执行查询
  const result = await gameRepository.findFeaturedGames(pagination)

  res.status(200).json({
    status: 'success',
    data: result
  })
})

/**
 * 获取免费游戏
 */
export const getFreeGames = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const pagination = getPaginationParams(req)
  const gameRepository = getGameRepositoryInstance()

  // 执行查询
  const result = await gameRepository.findFreeGames(pagination)

  res.status(200).json({
    status: 'success',
    data: result
  })
})

/**
 * 获取热门游戏（按下载量排序）
 */
export const getPopularGames = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const pagination = getPaginationParams(req)
  const gameRepository = getGameRepositoryInstance()

  // 执行查询
  const result = await gameRepository.findPopularGames(pagination)

  res.status(200).json({
    status: 'success',
    data: result
  })
})

/**
 * 获取最新游戏（按发布日期排序）
 */
export const getNewGames = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const pagination = getPaginationParams(req)
  const gameRepository = getGameRepositoryInstance()

  // 执行查询
  const result = await gameRepository.findLatestGames(pagination)

  res.status(200).json({
    status: 'success',
    data: result
  })
})

/**
 * 获取游戏统计信息
 */
export const getGameStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const gameRepository = getGameRepositoryInstance()

  // 获取游戏统计信息
  const stats = await gameRepository.getGameStats()

  const {
    totalGames,
    freeGames,
    paidGames,
    featuredGames,
    gamesByGenre,
    gamesByPlatform
  } = stats

  res.status(200).json({
    status: 'success',
    data: {
      totalGames,
      freeGames,
      paidGames,
      featuredGames,
      gamesByGenre,
      gamesByPlatform
    }
  })
})

/**
 * 上传游戏封面
 */
export const uploadGameCover = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const file = req.file
  const gameRepository = getGameRepositoryInstance()

  if (!file) {
    return next(new AppError('请上传游戏封面图片', 400))
  }

  const game = await gameRepository.findById(id)
  if (!game) {
    return next(new AppError('游戏不存在', 404))
  }

  // 更新游戏封面
  await gameRepository.updateCoverImage(id, file.path)

  res.status(200).json({
    status: 'success',
    message: '游戏封面上传成功',
    data: {
      coverImage: file.path
    }
  })
})

/**
 * 上传游戏截图
 */
export const uploadGameScreenshots = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const files = req.files as Express.Multer.File[]
  const gameRepository = getGameRepositoryInstance()

  if (!files || files.length === 0) {
    return next(new AppError('请上传游戏截图', 400))
  }

  const game = await gameRepository.findById(id)
  if (!game) {
    return next(new AppError('游戏不存在', 404))
  }

  // 添加新截图
  const newScreenshots = files.map(file => file.path)
  await gameRepository.addScreenshots(id, newScreenshots)

  res.status(200).json({
    status: 'success',
    message: '游戏截图上传成功',
    data: {
      screenshots: newScreenshots
    }
  })
})

/**
 * Get Latest Games
 * 获取最新游戏
 */
export const getLatestGames = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const pagination = getPaginationParams(req.query)
  const gameRepository = getGameRepositoryInstance()

  const result = await gameRepository.findLatestGames(pagination)

  res.status(200).json({
    status: 'success',
    data: result
  })
})

/**
 * Search Games
 * 搜索游戏
 */
export const searchGames = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { q, genre, platform, minRating, maxRating } = req.query
  const pagination = getPaginationParams(req.query)
  const gameRepository = getGameRepositoryInstance()

  if (!q) {
    return next(new AppError('搜索关键词不能为空', 400))
  }

  // 构建过滤条件
  const filters: any = {}
  if (genre) filters.genre = genre
  if (platform) filters.platform = platform

  // 执行搜索
  const result = await gameRepository.searchGames(q as string, filters, pagination)

  res.status(200).json({
    status: 'success',
    data: result
  })
})

/**
 * 获取推荐游戏（临时实现：返回热门游戏）
 */
export const getRecommendations = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 6
  const gameRepository = getGameRepositoryInstance()

  // 获取热门游戏作为推荐
  const result = await gameRepository.findGamesWithFilters(
    {
      availabilityStatus: GameAvailabilityStatus.ACTIVE,
      isFeatured: true
    },
    {
      page: 1,
      limit: limit,
      sortBy: 'play_count',
      sortOrder: 'DESC'
    }
  )

  res.status(200).json({
    status: 'success',
    data: {
      games: result.data,
      total: result.total
    }
  })
})