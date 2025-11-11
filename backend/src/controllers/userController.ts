import { Request, Response, NextFunction } from 'express'
import { User, Game, Favorite, Download } from '@/models'
import { catchAsync, AppError } from '@/middleware'
import { getPaginationParams, buildSequelizeQueryOptions, formatPaginationResult } from '@/utils/pagination'
import { Op } from 'sequelize'

/**
 * 获取用户列表（管理员）
 */
export const getUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { q, role, isActive, isEmailVerified } = req.query
  const pagination = getPaginationParams(req)

  // 构建查询条件
  const where: any = {}

  // 搜索关键词
  if (q) {
    where[Op.or] = [
      { username: { [Op.like]: `%${q}%` } },
      { email: { [Op.like]: `%${q}%` } }
    ]
  }

  // 角色过滤
  if (role) {
    where.role = role
  }

  // 是否激活过滤
  if (isActive !== undefined) {
    where.isActive = isActive === 'true'
  }

  // 是否邮箱验证过滤
  if (isEmailVerified !== undefined) {
    where.isEmailVerified = isEmailVerified === 'true'
  }

  // 构建查询选项
  const queryOptions = buildSequelizeQueryOptions(pagination, {
    where,
    attributes: { exclude: ['password'] }
  })

  // 执行查询
  const { count, rows } = await User.findAndCountAll(queryOptions)

  // 格式化分页结果
  const result = formatPaginationResult(rows, count, pagination.page || 1, pagination.limit || 10)

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

  const user = await User.findByPk(id, {
    attributes: { exclude: ['password'] }
  })
  
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
  const { username, email, avatar, role, isActive, isEmailVerified } = req.body

  const user = await User.findByPk(id)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  // 检查用户名是否已被其他用户使用
  if (username && username !== user.username) {
    const existingUser = await User.findOne({ where: { username } })
    if (existingUser) {
      return next(new AppError('用户名已存在', 400))
    }
  }

  // 检查邮箱是否已被其他用户使用
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return next(new AppError('邮箱已被注册', 400))
    }
  }

  // 更新用户信息
  if (username) user.username = username
  if (email) user.email = email
  if (avatar) user.avatar = avatar
  if (role) user.role = role
  if (isActive !== undefined) user.isActive = isActive
  if (isEmailVerified !== undefined) user.isEmailVerified = isEmailVerified

  await user.save()

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

  const user = await User.findByPk(id)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  await user.destroy()

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

  const user = await User.findByPk(id)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  // 切换用户状态
  user.isActive = !user.isActive
  await user.save()

  const status = user.isActive ? '启用' : '禁用'

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

  // 检查用户是否存在
  const user = await User.findByPk(id)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  // 构建查询选项
  const queryOptions = buildSequelizeQueryOptions(pagination, {
    include: [
      {
        model: Game,
        as: 'favoriteGames',
        where: { isActive: true }
      }
    ]
  })

  // 查找用户的收藏记录
  const { count, rows } = await Favorite.findAndCountAll({
    ...queryOptions,
    where: { userId: id }
  })

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
 * 获取用户下载记录
 */
export const getUserDownloads = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const { status } = req.query
  const pagination = getPaginationParams(req)

  // 检查用户是否存在
  const user = await User.findByPk(id)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  // 构建查询条件
  const where: any = { userId: id }
  
  // 状态过滤
  if (status) {
    where.status = status
  }

  // 构建查询选项
  const queryOptions = buildSequelizeQueryOptions(pagination, {
    where,
    include: [
      {
        model: Game,
        as: 'game',
        attributes: ['id', 'title', 'coverImage', 'genre', 'platform']
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
 * 获取用户统计信息
 */
export const getUserStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  // 检查用户是否存在
  const user = await User.findByPk(id)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  // 收藏游戏数
  const favoriteCount = await Favorite.count({ where: { userId: id } })

  // 下载记录数
  const downloadCount = await Download.count({ where: { userId: id } })

  // 已完成下载数
  const completedDownloadCount = await Download.count({
    where: { userId: id, status: 'completed' }
  })

  // 正在下载数
  const inProgressDownloadCount = await Download.count({
    where: { userId: id, status: 'in_progress' }
  })

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

  if (!file) {
    return next(new AppError('请上传头像图片', 400))
  }

  const user = await User.findByPk(id)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  // 更新用户头像
  user.avatar = file.path
  await user.save()

  res.status(200).json({
    status: 'success',
    message: '头像上传成功',
    data: {
      avatar: user.avatar
    }
  })
})