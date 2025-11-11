import { Request, Response, NextFunction } from 'express'
import { Favorite, Game, User } from '@/models'
import { catchAsync, AppError } from '@/middleware'
import { getPaginationParams, buildSequelizeQueryOptions, formatPaginationResult } from '@/utils/pagination'
import { Op } from 'sequelize'

/**
 * 获取收藏列表
 */
export const getFavorites = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, gameId } = req.query
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
        where: { isActive: true }
      }
    ],
    order: [['createdAt', 'DESC']]
  })

  // 执行查询
  const { count, rows } = await Favorite.findAndCountAll(queryOptions)

  // 格式化分页结果
  const result = formatPaginationResult(rows, count, pagination.page || 1, pagination.limit || 10)

  res.status(200).json({
    status: 'success',
    data: result
  })
})

/**
 * 获取收藏详情
 */
export const getFavoriteById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  const favorite = await Favorite.findByPk(id, {
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
  
  if (!favorite) {
    return next(new AppError('收藏记录不存在', 404))
  }

  res.status(200).json({
    status: 'success',
    data: {
      favorite
    }
  })
})

/**
 * 添加收藏
 */
export const addFavorite = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, gameId } = req.body

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

  // 检查是否已收藏
  const existingFavorite = await Favorite.findOne({
    where: { userId, gameId }
  })

  if (existingFavorite) {
    return next(new AppError('该游戏已在收藏列表中', 400))
  }

  // 创建收藏记录
  const favorite = await Favorite.create({
    userId,
    gameId
  })

  // 获取完整的收藏记录信息
  const fullFavorite = await Favorite.findByPk(favorite.id, {
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
    message: '收藏成功',
    data: {
      favorite: fullFavorite
    }
  })
})

/**
 * 取消收藏
 */
export const removeFavorite = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, gameId } = req.body

  // 查找收藏记录
  const favorite = await Favorite.findOne({
    where: { userId, gameId }
  })

  if (!favorite) {
    return next(new AppError('收藏记录不存在', 404))
  }

  // 删除收藏记录
  await favorite.destroy()

  res.status(200).json({
    status: 'success',
    message: '取消收藏成功'
  })
})

/**
 * 删除收藏记录（通过ID）
 */
export const deleteFavorite = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  const favorite = await Favorite.findByPk(id)
  if (!favorite) {
    return next(new AppError('收藏记录不存在', 404))
  }

  await favorite.destroy()

  res.status(200).json({
    status: 'success',
    message: '收藏记录删除成功'
  })
})

/**
 * 检查是否已收藏
 */
export const checkFavorite = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, gameId } = req.query

  if (!userId || !gameId) {
    return next(new AppError('用户ID和游戏ID不能为空', 400))
  }

  // 查找收藏记录
  const favorite = await Favorite.findOne({
    where: { 
      userId: userId as string,
      gameId: gameId as string
    }
  })

  res.status(200).json({
    status: 'success',
    data: {
      isFavorited: !!favorite
    }
  })
})

/**
 * 获取用户收藏的游戏列表
 */
export const getUserFavoriteGames = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params
  const { genre, platform, isFree } = req.query
  const pagination = getPaginationParams(req)

  // 检查用户是否存在
  const user = await User.findByPk(userId)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  // 构建游戏查询条件
  const gameWhere: any = { isActive: true }

  // 类型过滤
  if (genre) {
    gameWhere.genre = { [Op.contains]: [genre] }
  }

  // 平台过滤
  if (platform) {
    gameWhere.platform = { [Op.contains]: [platform] }
  }

  // 是否免费过滤
  if (isFree !== undefined) {
    gameWhere.isFree = isFree === 'true'
  }

  // 构建查询选项
  const queryOptions = buildSequelizeQueryOptions(pagination, {
    where: { userId },
    include: [
      {
        model: Game,
        as: 'game',
        where: gameWhere
      }
    ],
    order: [['createdAt', 'DESC']]
  })

  // 执行查询
  const { count, rows } = await Favorite.findAndCountAll(queryOptions)

  // 提取游戏信息
  const games = rows.map(favorite => favorite.game)

  // 格式化分页结果
  const result = formatPaginationResult(games, count, pagination.page || 1, pagination.limit || 10)

  res.status(200).json({
    status: 'success',
    data: result
  })
})

/**
 * 获取游戏收藏用户列表
 */
export const getGameFavoriteUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { gameId } = req.params
  const pagination = getPaginationParams(req)

  // 检查游戏是否存在
  const game = await Game.findByPk(gameId)
  if (!game) {
    return next(new AppError('游戏不存在', 404))
  }

  // 构建查询选项
  const queryOptions = buildSequelizeQueryOptions(pagination, {
    where: { gameId },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'avatar', 'role']
      }
    ],
    order: [['createdAt', 'DESC']]
  })

  // 执行查询
  const { count, rows } = await Favorite.findAndCountAll(queryOptions)

  // 提取用户信息
  const users = rows.map(favorite => favorite.user)

  // 格式化分页结果
  const result = formatPaginationResult(users, count, pagination.page || 1, pagination.limit || 10)

  res.status(200).json({
    status: 'success',
    data: result
  })
})

/**
 * 获取收藏统计信息
 */
export const getFavoriteStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
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

  // 总收藏数
  const totalFavorites = await Favorite.count({ where })

  // 获取最受欢迎的游戏（按收藏数排序）
  const popularGames = await Favorite.findAll({
    where,
    attributes: [
      'gameId',
      [Favorite.sequelize!.fn('COUNT', Favorite.sequelize!.col('gameId')), 'count']
    ],
    include: [
      {
        model: Game,
        as: 'game',
        attributes: ['id', 'title', 'coverImage']
      }
    ],
    group: ['gameId', 'game.id'],
    order: [[Favorite.sequelize!.literal('count'), 'DESC']],
    limit: 10
  })

  // 获取最活跃的用户（按收藏数排序）
  const activeUsers = await Favorite.findAll({
    where,
    attributes: [
      'userId',
      [Favorite.sequelize!.fn('COUNT', Favorite.sequelize!.col('userId')), 'count']
    ],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar']
      }
    ],
    group: ['userId', 'user.id'],
    order: [[Favorite.sequelize!.literal('count'), 'DESC']],
    limit: 10
  })

  res.status(200).json({
    status: 'success',
    data: {
      totalFavorites,
      popularGames,
      activeUsers
    }
  })
})