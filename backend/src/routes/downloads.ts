import { Router } from 'express'
import * as downloadController from '@/controllers/downloadController'
import * as validation from '@/utils/validation'
import { authenticate, authorize, requireAdmin, rateLimiter } from '@/middleware'

const router = Router()

// 获取下载列表（管理员）
router.get(
  '/',
  authenticate,
  requireAdmin,
  rateLimiter.generalLimiter,
  downloadController.getDownloads
)

// 获取下载详情（管理员）
router.get(
  '/:id',
  authenticate,
  requireAdmin,
  rateLimiter.generalLimiter,
  downloadController.getDownloadById
)

// 创建下载记录
router.post(
  '/',
  authenticate,
  rateLimiter.downloadLimiter,
  validation.validateCreateDownload,
  downloadController.createDownload
)

// 更新下载进度
router.put(
  '/:id/progress',
  authenticate,
  rateLimiter.generalLimiter,
  validation.validateUpdateDownloadProgress,
  downloadController.updateDownloadProgress
)

// 暂停下载
router.patch(
  '/:id/pause',
  authenticate,
  rateLimiter.generalLimiter,
  downloadController.pauseDownload
)

// 恢复下载
router.patch(
  '/:id/resume',
  authenticate,
  rateLimiter.generalLimiter,
  downloadController.resumeDownload
)

// 取消下载
router.patch(
  '/:id/cancel',
  authenticate,
  rateLimiter.generalLimiter,
  downloadController.cancelDownload
)

// 重试下载
router.patch(
  '/:id/retry',
  authenticate,
  rateLimiter.generalLimiter,
  downloadController.retryDownload
)

// 删除下载记录
router.delete(
  '/:id',
  authenticate,
  rateLimiter.generalLimiter,
  downloadController.deleteDownload
)

// 获取下载统计信息（管理员）
router.get(
  '/stats/data',
  authenticate,
  requireAdmin,
  rateLimiter.generalLimiter,
  downloadController.getDownloadStats
)

export default router