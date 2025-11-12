import { body, param, query, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import { AppError } from '../middleware/errorHandler'

/**
 * 处理验证结果
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg)
    return next(new AppError(errorMessages.join(', '), 400))
  }
  next()
}

/**
 * 用户注册验证
 */
export const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码长度至少为8个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含至少一个小写字母、一个大写字母和一个数字'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('确认密码与密码不匹配')
      }
      return true
    }),
  
  handleValidationErrors
]

/**
 * 用户登录验证
 */
export const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('密码不能为空'),
  
  handleValidationErrors
]

/**
 * 密码重置验证
 */
export const validatePasswordReset = [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  handleValidationErrors
]

/**
 * 新密码验证
 */
export const validateNewPassword = [
  body('token')
    .notEmpty()
    .withMessage('重置令牌不能为空'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码长度至少为8个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含至少一个小写字母、一个大写字母和一个数字'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('确认密码与新密码不匹配')
      }
      return true
    }),
  
  handleValidationErrors
]

/**
 * 游戏创建验证
 */
export const validateGameCreation = [
  body('title')
    .isLength({ min: 1, max: 100 })
    .withMessage('游戏标题长度必须在1-100个字符之间'),
  
  body('description')
    .isLength({ min: 10, max: 2000 })
    .withMessage('游戏描述长度必须在10-2000个字符之间'),
  
  body('genre')
    .isIn(['动作', '冒险', '角色扮演', '策略', '模拟', '体育', '竞速', '益智', '休闲', '其他'])
    .withMessage('无效的游戏类型'),
  
  body('platform')
    .isArray({ min: 1 })
    .withMessage('至少需要选择一个平台'),
  
  body('releaseDate')
    .isISO8601()
    .withMessage('请提供有效的发布日期'),
  
  body('developer')
    .isLength({ min: 1, max: 100 })
    .withMessage('开发者名称长度必须在1-100个字符之间'),
  
  handleValidationErrors
]

/**
 * 游戏更新验证
 */
export const validateGameUpdate = [
  param('id')
    .isUUID()
    .withMessage('无效的游戏ID'),
  
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('游戏标题长度必须在1-100个字符之间'),
  
  body('description')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage('游戏描述长度必须在10-2000个字符之间'),
  
  body('genre')
    .optional()
    .isIn(['动作', '冒险', '角色扮演', '策略', '模拟', '体育', '竞速', '益智', '休闲', '其他'])
    .withMessage('无效的游戏类型'),
  
  body('platform')
    .optional()
    .isArray({ min: 1 })
    .withMessage('至少需要选择一个平台'),
  
  handleValidationErrors
]

/**
 * ID参数验证
 */
export const validateIdParam = [
  param('id')
    .isUUID()
    .withMessage('无效的ID'),
  
  handleValidationErrors
]

/**
 * 分页查询验证
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  
  handleValidationErrors
]

/**
 * 搜索查询验证
 */
export const validateSearchQuery = [
  query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('搜索关键词长度必须在1-100个字符之间'),
  
  query('genre')
    .optional()
    .isIn(['动作', '冒险', '角色扮演', '策略', '模拟', '体育', '竞速', '益智', '休闲', '其他'])
    .withMessage('无效的游戏类型'),
  
  query('platform')
    .optional()
    .isIn(['Windows', 'macOS', 'Linux', 'Android', 'iOS', 'Web'])
    .withMessage('无效的平台'),
  
  ...validatePagination
]

/**
 * Email Verification Validation
 * 邮箱验证验证
 */
export const validateEmailVerification = [
  param('token')
    .notEmpty()
    .withMessage('验证令牌不能为空')
    .isLength({ min: 32, max: 64 })
    .withMessage('验证令牌格式无效'),
  
  handleValidationErrors
]

/**
 * Resend Verification Email Validation
 * 重新发送验证邮件验证
 */
export const validateResendVerification = [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  handleValidationErrors
]

/**
 * Forgot Password Validation
 * 忘记密码验证
 */
export const validateForgotPassword = [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  handleValidationErrors
]

/**
 * Reset Password Validation
 * 重置密码验证
 */
export const validateResetPassword = validateNewPassword

/**
 * Update User Validation
 * 更新用户验证
 */
export const validateUpdateUser = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  
  body('avatar')
    .optional()
    .isURL()
    .withMessage('头像必须是有效的URL'),
  
  handleValidationErrors
]

/**
 * Change Password Validation
 * 更改密码验证
 */
export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('当前密码不能为空'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('新密码长度至少为8个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('新密码必须包含至少一个小写字母、一个大写字母和一个数字'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('确认密码与新密码不匹配')
      }
      return true
    }),
  
  handleValidationErrors
]

/**
 * Create Download Validation
 * 创建下载验证
 */
export const validateCreateDownload = [
  body('gameId')
    .isUUID()
    .withMessage('游戏ID必须是有效的UUID'),
  
  handleValidationErrors
]

/**
 * Update Download Progress Validation
 * 更新下载进度验证
 */
export const validateUpdateDownloadProgress = [
  param('id')
    .isUUID()
    .withMessage('下载ID必须是有效的UUID'),
  
  body('progress')
    .isFloat({ min: 0, max: 100 })
    .withMessage('进度必须在0-100之间'),
  
  body('status')
    .optional()
    .isIn(['pending', 'downloading', 'completed', 'failed', 'paused'])
    .withMessage('无效的下载状态'),
  
  handleValidationErrors
]

/**
 * Add Favorite Validation
 * 添加收藏验证
 */
export const validateAddFavorite = [
  body('gameId')
    .isUUID()
    .withMessage('游戏ID必须是有效的UUID'),
  
  handleValidationErrors
]

/**
 * Remove Favorite Validation
 * 移除收藏验证
 */
export const validateRemoveFavorite = [
  param('gameId')
    .isUUID()
    .withMessage('游戏ID必须是有效的UUID'),
  
  handleValidationErrors
]

/**
 * Create Game Validation
 * 创建游戏验证
 */
export const validateCreateGame = [
  body('title')
    .notEmpty()
    .withMessage('游戏标题不能为空')
    .isLength({ min: 1, max: 100 })
    .withMessage('游戏标题长度必须在1-100个字符之间'),
  
  body('description')
    .notEmpty()
    .withMessage('游戏描述不能为空')
    .isLength({ min: 10, max: 2000 })
    .withMessage('游戏描述长度必须在10-2000个字符之间'),
  
  body('category')
    .notEmpty()
    .withMessage('游戏分类不能为空')
    .isIn(['action', 'adventure', 'rpg', 'strategy', 'simulation', 'sports', 'racing', 'puzzle', 'arcade', 'casual'])
    .withMessage('无效的游戏分类'),
  
  body('developer')
    .notEmpty()
    .withMessage('开发者不能为空')
    .isLength({ min: 1, max: 100 })
    .withMessage('开发者名称长度必须在1-100个字符之间'),
  
  body('version')
    .notEmpty()
    .withMessage('版本号不能为空')
    .matches(/^\d+\.\d+\.\d+$/)
    .withMessage('版本号格式必须为x.y.z'),
  
  handleValidationErrors
]

/**
 * Update Game Validation
 * 更新游戏验证
 */
export const validateUpdateGame = [
  param('id')
    .isUUID()
    .withMessage('游戏ID必须是有效的UUID'),
  
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('游戏标题长度必须在1-100个字符之间'),
  
  body('description')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage('游戏描述长度必须在10-2000个字符之间'),
  
  body('category')
    .optional()
    .isIn(['action', 'adventure', 'rpg', 'strategy', 'simulation', 'sports', 'racing', 'puzzle', 'arcade', 'casual'])
    .withMessage('无效的游戏分类'),
  
  body('version')
    .optional()
    .matches(/^\d+\.\d+\.\d+$/)
    .withMessage('版本号格式必须为x.y.z'),
  
  handleValidationErrors
]

/**
 * Update User By Admin Validation
 * 管理员更新用户验证
 */
export const validateUpdateUserByAdmin = [
  param('id')
    .isUUID()
    .withMessage('用户ID必须是有效的UUID'),
  
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('role')
    .optional()
    .isIn(['user', 'admin', 'moderator', 'developer'])
    .withMessage('无效的用户角色'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('激活状态必须是布尔值'),
  
  handleValidationErrors
]