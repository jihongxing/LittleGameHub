import { Request, Response, NextFunction } from 'express'
import { Game, User, Favorite, Download } from '@/models'
import { catchAsync, AppError } from '@/middleware'
import { getPaginationParams, buildSequelizeQueryOptions, formatPaginationResult } from '@/utils/pagination'
import { Op, WhereOptions } from 'sequelize'
import { Genre, Platform } from '@/models/Game'

/**
 * 获取游戏列表
 */
export const getGames = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { q, genre, platform, isFree, isFeatured } = req.query
  const pagination = getPaginationParams(req)

  // 构建查询条件
  const where: WhereOptions = {
    isActive: true
  }

  // 搜索关键词
  if (q) {
    where[Op.or] = [
      { title: { [Op.like]: `%${q}%` } },
      { description: { [Op.like]: `%${q}%` } },
      { developer: { [Op.like]: `%${q}%` } }
    ]
  }

  // 游戏类型过滤
  if (genre) {
    where.genre = genre as Genre
  }

  // 平台过滤
  if (platform) {
    where.platform = {
      [Op.contains]: [platform as Platform]
    }
  }

  // 是否免费过滤
  if (isFree !== undefined) {
    where.isFree = isFree === 'true'
  }

  // 是否精选过滤
  if (isFeatured !== undefined) {
    where.isFeatured = isFeatured === 'true'
  }

  // 构建查询选项
  const queryOptions = buildSequelizeQueryOptions(pagination, { where })

  // 执行查询
  const { count, rows } = await Game.findAndCountAll(queryOptions)

  // 格式化分页结果
  const result = formatPaginationResult(rows, count, pagination.page || 1, pagination.limit || 10)

  res.status(200).json({
    status: 'success',
    data: result
  })
})

/**
 * 获取游戏详情
 */
export const getGameById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  const game = await Game.findByPk(id)
  if (!game || !game.isActive) {
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

  const game = await Game.create({
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
  })

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

  const game = await Game.findByPk(id)
  if (!game) {
    return next(new AppError('游戏不存在', 404))
  }

  await game.update(updateData)

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

  const game = await Game.findByPk(id)
  if (!game) {
    return next(new AppError('游戏不存在', 404))
  }

  // 软删除：设置为不活跃
  await game.update({ isActive: false })

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

  // 构建查询条件
  const where = {
    isActive: true,
    isFeatured: true
  }

  // 构建查询选项
  const queryOptions = buildSequelizeQueryOptions(pagination, { where })

  // 执行查询
  const { count, rows } = await Game.findAndCountAll(queryOptions)

  // 格式化分页结果
  const result = formatPaginationResult(rows, count, pagination.page || 1, pagination.limit || 10)

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

  // 构建查询条件
  const where = {
    isActive: true,
    isFree: true
  }

  // 构建查询选项
  const queryOptions = buildSequelizeQueryOptions(pagination, { where })

  // 执行查询
  const { count, rows } = await Game.findAndCountAll(queryOptions)

  // 格式化分页结果
  const result = formatPaginationResult(rows, count, pagination.page || 1, pagination.limit || 10)

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

  // 构建查询条件
  const where = {
    isActive: true
  }

  // 构建查询选项，按下载量降序排序
  const queryOptions = buildSequelizeQueryOptions(
    { ...pagination, sortBy: 'downloadCount', sortOrder: 'DESC' },
    { where }
  )

  // 执行查询
  const { count, rows } = await Game.findAndCountAll(queryOptions)

  // 格式化分页结果
  const result = formatPaginationResult(rows, count, pagination.page || 1, pagination.limit || 10)

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

  // 构建查询条件
  const where = {
    isActive: true
  }

  // 构建查询选项，按发布日期降序排序
  const queryOptions = buildSequelizeQueryOptions(
    { ...pagination, sortBy: 'releaseDate', sortOrder: 'DESC' },
    { where }
  )

  // 执行查询
  const { count, rows } = await Game.findAndCountAll(queryOptions)

  // 格式化分页结果
  const result = formatPaginationResult(rows, count, pagination.page || 1, pagination.limit || 10)

  res.status(200).json({
    status: 'success',
    data: result
  })
})

/**
 * 获取游戏统计信息
 */
export const getGameStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // 总游戏数
  const totalGames = await Game.count({ where: { isActive: true } })

  // 免费游戏数
  const freeGames = await Game.count({ where: { isActive: true, isFree: true } })

  // 付费游戏数
  const paidGames = totalGames - freeGames

  // 精选游戏数
  const featuredGames = await Game.count({ where: { isActive: true, isFeatured: true } })

  // 按类型统计
  const gamesByGenre = await Game.findAll({
    attributes: [
      'genre',
      [Game.sequelize!.fn('COUNT', Game.sequelize!.col('id')), 'count']
    ],
    where: { isActive: true },
    group: ['genre'],
    raw: true
  })

  // 按平台统计
  const gamesByPlatform = await Game.findAll({
    attributes: [
      'platform',
      [Game.sequelize!.fn('COUNT', Game.sequelize!.col('id')), 'count']
    ],
    where: { isActive: true },
    group: ['platform'],
    raw: true
  })

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

  if (!file) {
    return next(new AppError('请上传游戏封面图片', 400))
  }

  const game = await Game.findByPk(id)
  if (!game) {
    return next(new AppError('游戏不存在', 404))
  }

  // 更新游戏封面
  game.coverImage = file.path
  await game.save()

  res.status(200).json({
    status: 'success',
    message: '游戏封面上传成功',
    data: {
      coverImage: game.coverImage
    }
  })
})

/**
 * 上传游戏截图
 */
export const uploadGameScreenshots = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const files = req.files as Express.Multer.File[]

  if (!files || files.length === 0) {
    return next(new AppError('请上传游戏截图', 400))
  }

  const game = await Game.findByPk(id)
  if (!game) {
    return next(new AppError('游戏不存在', 404))
  }

  // 获取现有截图
  const existingScreenshots = game.screenshots || []

  // 添加新截图
  const newScreenshots = files.map(file => file.path)
  game.screenshots = [...existingScreenshots, ...newScreenshots]
  await game.save()

  res.status(200).json({
    status: 'success',
    message: '游戏截图上传成功',
    data: {
      screenshots: game.screenshots
    }
  })
})