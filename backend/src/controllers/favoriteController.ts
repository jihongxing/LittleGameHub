import { Request, Response, NextFunction } from 'express'
import { getFavoriteRepositoryInstance, getUserRepositoryInstance, getGameRepositoryInstance } from '../repositories'
import { catchAsync, AppError } from '@/middleware'
import { getPaginationParams, formatPaginationResult } from '@/utils/pagination'

/**
 * 获取收藏列表
 */
export const getFavorites = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, gameId } = req.query
  const pagination = getPaginationParams(req)
  const favoriteRepository = getFavoriteRepositoryInstance()

  // 构建过滤条件
  const filters: any = {}
  if (userId) filters.userId = userId as string
  if (gameId) filters.gameId = gameId as string

  // 执行查询
  const result = await favoriteRepository.findFavoritesWithFilters(filters, pagination)

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
  const favoriteRepository = getFavoriteRepositoryInstance()

  const favorite = await favoriteRepository.findById(id)
  
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
  const favoriteRepository = getFavoriteRepositoryInstance()
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

  // 检查是否已收藏
  const isFavorited = await favoriteRepository.isFavorited(userId, gameId)
  if (isFavorited) {
    return next(new AppError('该游戏已在收藏列表中', 400))
  }

  // 创建收藏记录
  const favorite = favoriteRepository.create({
    userId,
    gameId
  })

  await favoriteRepository.save(favorite)

  // 获取完整的收藏记录信息
  const fullFavorite = await favoriteRepository.findById((favorite as any).id)

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
  const favoriteRepository = getFavoriteRepositoryInstance()

  // 删除收藏记录
  const removed = await favoriteRepository.removeByUserAndGame(userId, gameId)

  if (!removed) {
    return next(new AppError('收藏记录不存在', 404))
  }

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
  const favoriteRepository = getFavoriteRepositoryInstance()

  const favorite = await favoriteRepository.findById(id)
  if (!favorite) {
    return next(new AppError('收藏记录不存在', 404))
  }

  await favoriteRepository.remove(favorite)

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
  const favoriteRepository = getFavoriteRepositoryInstance()

  if (!userId || !gameId) {
    return next(new AppError('用户ID和游戏ID不能为空', 400))
  }

  // 检查收藏状态
  const isFavorited = await favoriteRepository.isFavorited(
    userId as string,
    gameId as string
  )

  res.status(200).json({
    status: 'success',
    data: {
      isFavorited
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
  const userRepository = getUserRepositoryInstance()
  const favoriteRepository = getFavoriteRepositoryInstance()

  // 检查用户是否存在
  const user = await userRepository.findById(userId)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  // 构建过滤条件
  const filters: any = {}
  if (genre) filters.genre = genre
  if (platform) filters.platform = platform
  if (isFree) filters.isFree = isFree === 'true'

  // 执行查询
  const result = await favoriteRepository.findUserFavoriteGames(userId, filters, pagination)

  // 提取游戏信息
  const games = result.data.map(favorite => favorite.game)

  res.status(200).json({
    status: 'success',
    data: {
      ...result,
      data: games
    }
  })
})

/**
 * 获取游戏收藏用户列表
 */
export const getGameFavoriteUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { gameId } = req.params
  const pagination = getPaginationParams(req)
  const gameRepository = getGameRepositoryInstance()
  const favoriteRepository = getFavoriteRepositoryInstance()

  // 检查游戏是否存在
  const game = await gameRepository.findById(gameId)
  if (!game) {
    return next(new AppError('游戏不存在', 404))
  }

  // 执行查询
  const result = await favoriteRepository.findGameFavoriteUsers(gameId, pagination)

  // 提取用户信息
  const users = result.data.map(favorite => favorite.user)

  res.status(200).json({
    status: 'success',
    data: {
      ...result,
      data: users
    }
  })
})

/**
 * 获取收藏统计信息
 */
export const getFavoriteStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, gameId, period } = req.query
  const favoriteRepository = getFavoriteRepositoryInstance()

  // 构建过滤条件
  const filters: any = {}
  if (userId) filters.userId = userId as string
  if (gameId) filters.gameId = gameId as string
  if (period) filters.period = period as 'today' | 'week' | 'month' | 'year'

  // 获取统计信息
  const stats = await favoriteRepository.getFavoriteStats(filters)

  const { totalFavorites, popularGames, activeUsers } = stats

  res.status(200).json({
    status: 'success',
    data: {
      totalFavorites,
      popularGames,
      activeUsers
    }
  })
})