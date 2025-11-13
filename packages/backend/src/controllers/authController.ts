/**
 * GameHub Authentication Controller
 * GameHub 认证控制器
 * 
 * This controller handles all authentication-related HTTP requests including
 * user registration, login, password management, and email verification.
 * 
 * 此控制器处理所有与认证相关的 HTTP 请求，包括
 * 用户注册、登录、密码管理和邮箱验证。
 * 
 * Key features:
 * - User registration with email verification
 * - User login with JWT token generation
 * - Password reset functionality
 * - Token refresh mechanism
 * - User profile management
 * 
 * 主要功能：
 * - 带邮箱验证的用户注册
 * - 带 JWT 令牌生成的用户登录
 * - 密码重置功能
 * - 令牌刷新机制
 * - 用户资料管理
 * 
 * @author GameHub Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Request, Response, NextFunction } from 'express'
import { getUserRepositoryInstance } from '../repositories'
import { generateToken, generateRefreshToken, verifyToken, extractTokenFromHeader } from '@/utils/jwt'
import { hashPassword, verifyPassword, generateRandomToken } from '@/utils/encryption'
import { sendVerificationEmail, sendPasswordResetEmail } from '@/utils/email'
import { catchAsync, AppError } from '@/middleware'
import { tokenBlacklistService } from '@/services/security/token-blacklist.service'
import { passwordStrengthService } from '@/services/security/password-strength.service'

/**
 * User Registration
 * 用户注册
 * 
 * Registers a new user account with email verification.
 * Creates a user record, sends verification email, and returns JWT tokens.
 * 
 * 注册新用户账户并进行邮箱验证。
 * 创建用户记录，发送验证邮件，并返回 JWT 令牌。
 * 
 * Process flow:
 * 1. Validate username and email uniqueness
 * 2. Generate email verification token
 * 3. Create user record in database
 * 4. Send verification email
 * 5. Generate and return JWT tokens
 * 
 * 处理流程：
 * 1. 验证用户名和邮箱的唯一性
 * 2. 生成邮箱验证令牌
 * 3. 在数据库中创建用户记录
 * 4. 发送验证邮件
 * 5. 生成并返回 JWT 令牌
 * 
 * @param req - Express request object containing username, email, password
 *              包含用户名、邮箱、密码的 Express 请求对象
 * @param res - Express response object
 *              Express 响应对象
 * @param next - Express next function for error handling
 *               用于错误处理的 Express next 函数
 * 
 * @returns {Promise<void>} JSON response with user data and tokens
 *                          包含用户数据和令牌的 JSON 响应
 */
export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { username, email, password } = req.body
  const userRepository = getUserRepositoryInstance()

  // Check if username or email already exists
  // 检查用户名或邮箱是否已存在
  const existingUserByUsername = await userRepository.findByUsername(username)
  const existingUserByEmail = await userRepository.findByEmail(email)

  if (existingUserByUsername) {
    return next(new AppError('用户名已存在', 400))
  }
  if (existingUserByEmail) {
    return next(new AppError('邮箱已被注册', 400))
  }

  // Check password strength
  // 检查密码强度
  const passwordCheck = passwordStrengthService.checkPassword(password, [username, email])
  if (!passwordCheck.isAcceptable) {
    const suggestions = passwordCheck.feedback.suggestions.join('；')
    return next(new AppError(
      `密码强度不足（强度等级：${passwordCheck.score}/4）。${suggestions}`,
      400
    ))
  }

  // Generate email verification token
  // 生成邮箱验证令牌
  const emailVerificationToken = generateRandomToken(32)
  
  // Create new user record
  // 创建新用户记录
  const user = userRepository.create({
    nickname: username,
    email,
    password_hash: await hashPassword(password),
    email_verification_token: emailVerificationToken
  })
  
  await userRepository.save(user)

  // 发送验证邮件
  try {
    await sendVerificationEmail(email, emailVerificationToken)
  } catch (error) {
    // If email sending fails, delete user and return error
    // 如果邮件发送失败，删除用户并返回错误
    await userRepository.remove(user)
    return next(new AppError('注册成功，但验证邮件发送失败，请稍后再试', 500))
  }

  // 生成JWT令牌
  const token = generateToken({
    id: user.id,
    email: user.email || '',
    role: 'user'
  })

  const refreshToken = generateRefreshToken({
    id: user.id,
    email: user.email || ''
  })

  // 返回用户信息（不包含密码）
  const userResponse = {
    id: user.id,
    username: user.nickname,
    email: user.email,
    avatar: user.avatar,
    role: 'user',
    isActive: user.is_active,
    isEmailVerified: user.is_email_verified,
    createdAt: user.created_at
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
  const userRepository = getUserRepositoryInstance()

  // 查找用户（包含密码字段）
  const user = await userRepository.findByEmailWithPassword(email)
  if (!user) {
    return next(new AppError('邮箱或密码错误', 401))
  }

  // 验证密码
  const isPasswordValid = await verifyPassword(password, user.password_hash || '')
  if (!isPasswordValid) {
    return next(new AppError('邮箱或密码错误', 401))
  }

  // 检查账户是否激活
  if (!user.is_active) {
    return next(new AppError('账户已被禁用，请联系管理员', 401))
  }

  // 更新最后登录时间
  await userRepository.updateLastActiveDate(user.id)

  // 生成JWT令牌
  const token = generateToken({
    id: user.id,
    email: user.email || '',
    role: user.role
  })

  const refreshToken = generateRefreshToken({
    id: user.id,
    email: user.email || ''
  })

  // 返回用户信息（不包含密码）
  const userResponse = {
    id: user.id,
    username: user.nickname,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    isActive: user.is_active,
    isEmailVerified: user.is_email_verified,
    lastLoginAt: user.last_active_date
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
 * User Logout
 * 用户登出
 * 
 * Logs out the current user by adding their token to the blacklist.
 * This invalidates the token and forces the user to login again.
 * 
 * 通过将令牌加入黑名单来登出当前用户。
 * 这会使令牌失效并强制用户重新登录。
 * 
 * Process flow:
 * 1. Extract token from Authorization header
 * 2. Add token to blacklist (Redis)
 * 3. Return success message
 * 
 * 处理流程：
 * 1. 从 Authorization 头中提取令牌
 * 2. 将令牌添加到黑名单（Redis）
 * 3. 返回成功消息
 * 
 * @param req - Express request object with Authorization header
 *              包含 Authorization 头的 Express 请求对象
 * @param res - Express response object
 *              Express 响应对象
 * @param next - Express next function for error handling
 *               用于错误处理的 Express next 函数
 * 
 * @returns {Promise<void>} JSON response confirming logout
 *                          确认登出的 JSON 响应
 */
export const logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 从请求头中获取令牌
    const token = extractTokenFromHeader(req.headers.authorization)
    
    if (!token) {
      return next(new AppError('未提供认证令牌', 401))
    }

    // 将令牌加入黑名单
    // Token will automatically expire based on its exp claim
    // 令牌会根据其 exp 声明自动过期
    await tokenBlacklistService.addToBlacklist(token)

    res.status(200).json({
      status: 'success',
      message: '登出成功'
    })
  } catch (error) {
    return next(new AppError('登出失败', 500))
  }
})

/**
 * 刷新令牌
 */
export const refreshToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body
  const userRepository = getUserRepositoryInstance()

  if (!refreshToken) {
    return next(new AppError('未提供刷新令牌', 400))
  }

  // 验证刷新令牌
  const decoded = verifyToken(refreshToken)
  
  // 查找用户
  const user = await userRepository.findById(decoded.id)
  if (!user || !user.is_active) {
    return next(new AppError('无效的刷新令牌', 401))
  }

  // 生成新的JWT令牌
  const token = generateToken({
    id: user.id,
    email: user.email || '',
    role: user.role
  })

  const newRefreshToken = generateRefreshToken({
    id: user.id,
    email: user.email || ''
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
  const userRepository = getUserRepositoryInstance()

  // 查找用户
  const user = await userRepository.findByEmailVerificationToken(token)
  if (!user) {
    return next(new AppError('无效的验证令牌', 400))
  }

  // 更新用户状态
  await userRepository.verifyEmail(user.id)

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
  const userRepository = getUserRepositoryInstance()

  // 查找用户
  const user = await userRepository.findByEmail(email)
  if (!user) {
    return next(new AppError('用户不存在', 404))
  }

  // 检查是否已验证
  if (user.is_email_verified) {
    return next(new AppError('邮箱已验证', 400))
  }

  // 生成新的验证令牌
  const emailVerificationToken = generateRandomToken(32)
  await userRepository.updateEmailVerificationToken(user.id, emailVerificationToken)

  // 发送验证邮件
  try {
    await sendVerificationEmail(email, emailVerificationToken)
  } catch (error) {
    return next(new AppError('验证邮件发送失败，请稍后再试', 500))
  }

  res.status(200).json({
    status: 'success',
    message: '验证邮件已重新发送'
  })
})

/**
 * 请求密码重置
 */
export const requestPasswordReset = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body
  const userRepository = getUserRepositoryInstance()

  // 查找用户
  const user = await userRepository.findByEmail(email)
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
  await userRepository.setPasswordResetToken(user.id, passwordResetToken, passwordResetExpires)

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
  const userRepository = getUserRepositoryInstance()

  // 查找用户
  const user = await userRepository.findByPasswordResetToken(token)

  if (!user) {
    return next(new AppError('无效或已过期的重置令牌', 400))
  }

  // Check new password strength
  // 检查新密码强度
  const passwordCheck = passwordStrengthService.checkPassword(password, [user.nickname || '', user.email || ''])
  if (!passwordCheck.isAcceptable) {
    const suggestions = passwordCheck.feedback.suggestions.join('；')
    return next(new AppError(
      `新密码强度不足（强度等级：${passwordCheck.score}/4）。${suggestions}`,
      400
    ))
  }

  // 更新密码
  const passwordHash = await hashPassword(password)
  await userRepository.updatePassword(user.id, passwordHash)
  await userRepository.clearPasswordResetToken(user.id)

  res.status(200).json({
    status: 'success',
    message: '密码重置成功，请使用新密码登录'
  })
})

/**
 * Get Current User Information
 * 获取当前用户信息
 * 
 * Returns the current authenticated user's information.
 * This endpoint requires authentication.
 * 
 * 返回当前已认证用户的信息。
 * 此端点需要身份验证。
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
 * Get Current User Information (alias)
 * 获取当前用户信息（别名）
 */
export const getCurrentUser = getMe

/**
 * Update Current User Information
 * 更新当前用户信息
 */
export const updateMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { username, avatar } = req.body
  const user = req.user
  const userRepository = getUserRepositoryInstance()

  if (!user) {
    return next(new AppError('未授权', 401))
  }

  // 检查用户名是否已被其他用户使用
  if (username && username !== user.nickname) {
    const isExists = await userRepository.isUsernameExists(username, user.id)
    if (isExists) {
      return next(new AppError('用户名已存在', 400))
    }
  }

  // 更新用户信息
  const updatedUser = await userRepository.findById(user.id)
  if (!updatedUser) {
    return next(new AppError('用户不存在', 404))
  }

  if (username) updatedUser.nickname = username
  if (avatar) updatedUser.avatar = avatar

  await userRepository.save(updatedUser)

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
  const userRepository = getUserRepositoryInstance()

  if (!user) {
    return next(new AppError('未授权', 401))
  }

  // 获取包含密码的用户信息
  const userWithPassword = await userRepository.findByEmailWithPassword(user.email || '')
  if (!userWithPassword) {
    return next(new AppError('用户不存在', 404))
  }

  // 验证当前密码
  const isCurrentPasswordValid = await verifyPassword(currentPassword, userWithPassword.password_hash || '')
  if (!isCurrentPasswordValid) {
    return next(new AppError('当前密码错误', 400))
  }

  // Check new password strength
  // 检查新密码强度
  const passwordCheck = passwordStrengthService.checkPassword(newPassword, [user.nickname || '', user.email || ''])
  if (!passwordCheck.isAcceptable) {
    const suggestions = passwordCheck.feedback.suggestions.join('；')
    return next(new AppError(
      `新密码强度不足（强度等级：${passwordCheck.score}/4）。${suggestions}`,
      400
    ))
  }

  // 更新密码
  const passwordHash = await hashPassword(newPassword)
  await userRepository.updatePassword(user.id, passwordHash)

  res.status(200).json({
    status: 'success',
    message: '密码更改成功'
  })
})

/**
 * Update Current User Information (alias)
 * 更新当前用户信息（别名）
 */
export const updateCurrentUser = updateMe

/**
 * Forgot Password (alias for requestPasswordReset)
 * 忘记密码（requestPasswordReset的别名）
 */
export const forgotPassword = requestPasswordReset