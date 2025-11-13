import { Request, Response, NextFunction } from 'express'
import { getUserRepositoryInstance, getFavoriteRepositoryInstance, getDownloadRepositoryInstance } from '../repositories'
import { catchAsync, AppError } from '@/middleware'
import { getPaginationParams, formatPaginationResult } from '@/utils/pagination'

/**
 * 获取用户列表（管理员）
 */
export const getUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { q, role, isActive, isEmailVerified } = req.query
  const pagination = getPaginationParams(req)
  const userRepository = getUserRepositoryInstance()

  // 构建过滤条件
  const filters = {
    q: q as string,
    role: role as string,
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    isEmailVerified: isEmailVerified === 'true' ? true : isEmailVerified === 'false' ? false : undefined
  }

  // 执行查询
  const result = await userRepository.findUsersWithFilters(filters, pagination)

  res.status(200).json({
    status: 'success',
    data: result
  })
})

/**
 * 获取用户详情
 */
export const getUserById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const userRepository = getUserRepositoryInstance()

  const user = await userRepository.findByIdWithoutPassword(id)
  
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  })
})

/**
 * 更新用户信息（管理员）
 */
export const updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const { nickname, email, avatar, role, isActive, isEmailVerified } = req.body
  const userRepository = getUserRepositoryInstance()

  const user = await userRepository.findById(id)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  // 检查昵称是否已被其他用户使用
  if (nickname && nickname !== user.nickname) {
    const isExists = await userRepository.isUsernameExists(nickname, id)
    if (isExists) {
      return next(new AppError('昵称已存在', 400))
    }
  }

  // 检查邮箱是否已被其他用户使用
  if (email && email !== user.email) {
    const isExists = await userRepository.isEmailExists(email, id)
    if (isExists) {
      return next(new AppError('邮箱已被注册', 400))
    }
  }

  // 更新用户信息
  if (nickname) user.nickname = nickname
  if (email) user.email = email
  if (avatar) user.avatar = avatar
  if (role) user.role = role
  if (isActive !== undefined) user.is_active = isActive
  if (isEmailVerified !== undefined) user.is_email_verified = isEmailVerified

  await userRepository.save(user)

  res.status(200).json({
    status: 'success',
    message: '用户信息更新成功',
    data: {
      user
    }
  })
})

/**
 * 删除用户（管理员）
 */
export const deleteUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const userRepository = getUserRepositoryInstance()

  const user = await userRepository.findById(id)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  await userRepository.remove(user)

  res.status(200).json({
    status: 'success',
    message: '用户删除成功'
  })
})

/**
 * 禁用/启用用户（管理员）
 */
export const toggleUserStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const userRepository = getUserRepositoryInstance()

  const user = await userRepository.toggleActiveStatus(id)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  const status = user.is_active ? '启用' : '禁用'

  res.status(200).json({
    status: 'success',
    message: `用户${status}成功`,
    data: {
      user
    }
  })
})

/**
 * 获取用户收藏的游戏
 */
export const getUserFavorites = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const pagination = getPaginationParams(req)
  const userRepository = getUserRepositoryInstance()
  const favoriteRepository = getFavoriteRepositoryInstance()

  // 检查用户是否存在
  const user = await userRepository.findById(id)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  // 查找用户的收藏记录
  const result = await favoriteRepository.findUserFavoriteGames(id, {}, pagination)

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
 * 获取用户下载记录
 */
export const getUserDownloads = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const { status } = req.query
  const pagination = getPaginationParams(req)
  const userRepository = getUserRepositoryInstance()
  const downloadRepository = getDownloadRepositoryInstance()

  // 检查用户是否存在
  const user = await userRepository.findById(id)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  // 构建过滤条件
  const filters: any = {}
  if (status) {
    filters.status = status
  }

  // 执行查询
  const result = await downloadRepository.findUserDownloads(id, filters, pagination)

  res.status(200).json({
    status: 'success',
    data: result
  })
})

/**
 * 获取用户统计信息
 */
export const getUserStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const userRepository = getUserRepositoryInstance()
  const favoriteRepository = getFavoriteRepositoryInstance()
  const downloadRepository = getDownloadRepositoryInstance()

  // 检查用户是否存在
  const user = await userRepository.findById(id)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  // 收藏游戏数
  const favoriteCount = await favoriteRepository.countUserFavorites(id)

  // 下载记录数
  const downloadCount = await downloadRepository.countUserDownloadsByStatus(id)

  // 已完成下载数
  const completedDownloadCount = await downloadRepository.countUserDownloadsByStatus(id, 'completed' as any)

  // 正在下载数
  const inProgressDownloadCount = await downloadRepository.countUserDownloadsByStatus(id, 'in_progress' as any)

  res.status(200).json({
    status: 'success',
    data: {
      user,
      stats: {
        favoriteCount,
        downloadCount,
        completedDownloadCount,
        inProgressDownloadCount
      }
    }
  })
})

/**
 * 上传用户头像
 */
export const uploadUserAvatar = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const file = req.file
  const userRepository = getUserRepositoryInstance()

  if (!file) {
    return next(new AppError('请上传头像图片', 400))
  }

  const user = await userRepository.findById(id)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  // 更新用户头像
  user.avatar = file.path
  await userRepository.save(user)

  res.status(200).json({
    status: 'success',
    message: '头像上传成功',
    data: {
      avatar: user.avatar
    }
  })
})