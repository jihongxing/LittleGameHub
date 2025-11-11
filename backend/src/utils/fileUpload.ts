import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { Request } from 'express'
import { AppError } from '@/middleware/errorHandler'

// 确保上传目录存在
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// 配置存储
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    let uploadPath = 'uploads/'
    
    // 根据文件类型设置不同的上传目录
    if (file.fieldname === 'gameIcon' || file.fieldname === 'gameCover') {
      uploadPath += 'games/'
    } else if (file.fieldname === 'avatar') {
      uploadPath += 'avatars/'
    } else if (file.fieldname === 'screenshot') {
      uploadPath += 'screenshots/'
    } else {
      uploadPath += 'others/'
    }
    
    ensureDirectoryExists(uploadPath)
    cb(null, uploadPath)
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 允许的图片类型
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError('不支持的文件类型，只允许 JPEG、PNG、GIF 和 WebP 格式的图片', 400))
  }
}

// 创建multer实例
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10 // 最多10个文件
  }
})

// 单文件上传中间件
export const uploadSingle = (fieldName: string) => {
  return (req: Request, res: any, next: any) => {
    upload.single(fieldName)(req, res, (err: any) => {
      if (err) {
        return next(err)
      }
      next()
    })
  }
}

// 多文件上传中间件
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => {
  return (req: Request, res: any, next: any) => {
    upload.array(fieldName, maxCount)(req, res, (err: any) => {
      if (err) {
        return next(err)
      }
      next()
    })
  }
}

/**
 * 删除文件
 */
export const deleteFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      return true
    }
    return false
  } catch (error) {
    console.error('删除文件失败:', error)
    return false
  }
}

/**
 * 获取文件信息
 */
export const getFileInfo = (filePath: string) => {
  try {
    if (!fs.existsSync(filePath)) {
      return null
    }
    
    const stats = fs.statSync(filePath)
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    }
  } catch (error) {
    console.error('获取文件信息失败:', error)
    return null
  }
}