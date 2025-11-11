import { Request, Response, NextFunction } from 'express'
import { User } from '@/models'
import { generateToken, generateRefreshToken } from '@/utils/jwt'
import { hashPassword, verifyPassword, generateRandomToken } from '@/utils/encryption'
import { sendVerificationEmail, sendPasswordResetEmail } from '@/utils/email'
import { catchAsync, AppError } from '@/middleware'
import { Op } from 'sequelize'

/**
 * 用户注册
 */
export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { username, email, password } = req.body

  // 检查用户名是否已存在
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ username }, { email }]
    }
  })

  if (existingUser) {
    if (existingUser.username === username) {
      return next(new AppError('用户名已存在', 400))
    }
    if (existingUser.email === email) {
      return next(new AppError('邮箱已被注册', 400))
    }
  }

  // 生成邮箱验证令牌
  const emailVerificationToken = generateRandomToken(32)
  
  // 创建用户
  const user = await User.create({
    username,
    email,
    password,
    emailVerificationToken
  })

  // 发送验证邮件
  try {
    await sendVerificationEmail(email, emailVerificationToken)
  } catch (error) {
    // 如果邮件发送失败，删除用户并返回错误
    await user.destroy()
    return next(new AppError('注册成功，但验证邮件发送失败，请稍后再试', 500))
  }

  // 生成JWT令牌
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  })

  const refreshToken = generateRefreshToken({
    id: user.id,
    email: user.email
  })

  // 返回用户信息（不包含密码）
  const userResponse = {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt
  }

  res.status(201).json({
    status: 'success',
    message: '注册成功，请检查邮箱进行验证',
    data: {
      user: userResponse,
      token,
      refreshToken
    }
  })
})

/**
 * 用户登录
 */
export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body

  // 查找用户（包含密码字段）
  const user = await User.findOne({ where: { email } })
  if (!user) {
    return next(new AppError('邮箱或密码错误', 401))
  }

  // 验证密码
  const isPasswordValid = await verifyPassword(password, user.password)
  if (!isPasswordValid) {
    return next(new AppError('邮箱或密码错误', 401))
  }

  // 检查账户是否激活
  if (!user.isActive) {
    return next(new AppError('账户已被禁用，请联系管理员', 401))
  }

  // 更新最后登录时间
  user.lastLoginAt = new Date()
  await user.save()

  // 生成JWT令牌
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  })

  const refreshToken = generateRefreshToken({
    id: user.id,
    email: user.email
  })

  // 返回用户信息（不包含密码）
  const userResponse = {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    lastLoginAt: user.lastLoginAt
  }

  res.status(200).json({
    status: 'success',
    message: '登录成功',
    data: {
      user: userResponse,
      token,
      refreshToken
    }
  })
})

/**
 * 刷新令牌
 */
export const refreshToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    return next(new AppError('未提供刷新令牌', 400))
  }

  // 验证刷新令牌
  const decoded = verifyToken(refreshToken)
  
  // 查找用户
  const user = await User.findByPk(decoded.id)
  if (!user || !user.isActive) {
    return next(new AppError('无效的刷新令牌', 401))
  }

  // 生成新的JWT令牌
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  })

  const newRefreshToken = generateRefreshToken({
    id: user.id,
    email: user.email
  })

  res.status(200).json({
    status: 'success',
    message: '令牌刷新成功',
    data: {
      token,
      refreshToken: newRefreshToken
    }
  })
})

/**
 * 验证邮箱
 */
export const verifyEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.params

  // 查找用户
  const user = await User.findOne({ where: { emailVerificationToken: token } })
  if (!user) {
    return next(new AppError('无效的验证令牌', 400))
  }

  // 更新用户状态
  user.isEmailVerified = true
  user.emailVerificationToken = null
  await user.save()

  res.status(200).json({
    status: 'success',
    message: '邮箱验证成功'
  })
})

/**
 * 重新发送验证邮件
 */
export const resendVerificationEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body

  // 查找用户
  const user = await User.findOne({ where: { email } })
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  // 检查是否已验证
  if (user.isEmailVerified) {
    return next(new AppError('邮箱已验证', 400))
  }

  // 生成新的验证令牌
  const emailVerificationToken = generateRandomToken(32)
  user.emailVerificationToken = emailVerificationToken
  await user.save()

  // 发送验证邮件
  try {
    await sendVerificationEmail(email, emailVerificationToken)
  } catch (error) {
    return next(new AppError('验证邮件发送失败，请稍后再试', 500))
  }

  res.status(200).json({
    status: 'success',
    message: '验证邮件已发送，请检查邮箱'
  })
})

/**
 * 请求密码重置
 */
export const requestPasswordReset = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body

  // 查找用户
  const user = await User.findOne({ where: { email } })
  if (!user) {
    // 为了安全，即使用户不存在也返回成功消息
    return res.status(200).json({
      status: 'success',
      message: '如果该邮箱已注册，您将收到密码重置邮件'
    })
  }

  // 生成重置令牌
  const passwordResetToken = generateRandomToken(32)
  const passwordResetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期

  // 更新用户
  user.passwordResetToken = passwordResetToken
  user.passwordResetExpires = passwordResetExpires
  await user.save()

  // 发送重置邮件
  try {
    await sendPasswordResetEmail(email, passwordResetToken)
  } catch (error) {
    return next(new AppError('密码重置邮件发送失败，请稍后再试', 500))
  }

  res.status(200).json({
    status: 'success',
    message: '如果该邮箱已注册，您将收到密码重置邮件'
  })
})

/**
 * 重置密码
 */
export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { token, password } = req.body

  // 查找用户
  const user = await User.findOne({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        [Op.gt]: new Date()
      }
    }
  })

  if (!user) {
    return next(new AppError('无效或已过期的重置令牌', 400))
  }

  // 更新密码
  user.password = password
  user.passwordResetToken = null
  user.passwordResetExpires = null
  await user.save()

  res.status(200).json({
    status: 'success',
    message: '密码重置成功，请使用新密码登录'
  })
})

/**
 * 获取当前用户信息
 */
export const getMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  })
})

/**
 * 更新当前用户信息
 */
export const updateMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { username, avatar } = req.body
  const user = req.user

  // 检查用户名是否已被其他用户使用
  if (username && username !== user.username) {
    const existingUser = await User.findOne({ where: { username } })
    if (existingUser) {
      return next(new AppError('用户名已存在', 400))
    }
    user.username = username
  }

  // 更新头像
  if (avatar) {
    user.avatar = avatar
  }

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
 * 更改密码
 */
export const changePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { currentPassword, newPassword } = req.body
  const user = req.user

  // 获取包含密码的用户信息
  const userWithPassword = await User.findByPk(user.id)
  if (!userWithPassword) {
    return next(new AppError('用户不存在', 404))
  }

  // 验证当前密码
  const isCurrentPasswordValid = await verifyPassword(currentPassword, userWithPassword.password)
  if (!isCurrentPasswordValid) {
    return next(new AppError('当前密码错误', 400))
  }

  // 更新密码
  userWithPassword.password = newPassword
  await userWithPassword.save()

  res.status(200).json({
    status: 'success',
    message: '密码更改成功'
  })
})