/**
 * 文件上传错误类
 * File Upload Error Class
 *
 * 自定义文件上传相关的错误类型
 * Custom error types for file upload operations
 */
import { AppError } from '@/middleware/errorHandler';

export class FileUploadError extends AppError {
  public readonly uploadErrorCode: string;

  constructor(message: string, errorCode: string, originalError?: any) {
    super(message, 400, 'VALIDATION', originalError);
    this.uploadErrorCode = errorCode;
    this.name = 'FileUploadError';

    // 维护正确的堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 根据错误代码获取HTTP状态码
   * Get HTTP status code based on error code
   */
  static getHttpStatus(errorCode: string): number {
    const statusMap: Record<string, number> = {
      // 文件大小相关
      'FILE_TOO_LARGE': 413, // Payload Too Large
      'FILE_TOO_SMALL': 400,

      // 文件类型相关
      'INVALID_MIME_TYPE': 415, // Unsupported Media Type
      'INVALID_EXTENSION': 415,
      'INVALID_CONTENT': 415,

      // 安全相关
      'SECURITY_THREAT': 403, // Forbidden
      'UNSAFE_FILENAME': 400,
      'INVALID_PATH': 400,

      // 上传过程相关
      'UPLOAD_FAILED': 500,
      'PROCESSING_FAILED': 500,
      'STORAGE_FAILED': 500,
      'BATCH_UPLOAD_FAILED': 400,

      // 权限相关
      'ACCESS_DENIED': 403,
      'QUOTA_EXCEEDED': 413,
    };

    return statusMap[errorCode] || 400;
  }

  /**
   * 创建文件大小错误
   * Create file size error
   */
  static fileTooLarge(actualSize: number, maxSize: number): FileUploadError {
    const message = `文件过大: ${this.formatBytes(actualSize)}, 最大允许: ${this.formatBytes(maxSize)}`;
    const error = new FileUploadError(message, 'FILE_TOO_LARGE');
    error.statusCode = this.getHttpStatus('FILE_TOO_LARGE');
    return error;
  }

  /**
   * 创建文件类型错误
   * Create file type error
   */
  static invalidFileType(mimeType: string, allowedTypes: string[]): FileUploadError {
    const message = `不支持的文件类型: ${mimeType}. 允许的类型: ${allowedTypes.join(', ')}`;
    return new FileUploadError(message, 'INVALID_MIME_TYPE');
  }

  /**
   * 创建安全威胁错误
   * Create security threat error
   */
  static securityThreat(threat: string): FileUploadError {
    const message = `检测到安全威胁: ${threat}`;
    const error = new FileUploadError(message, 'SECURITY_THREAT');
    error.statusCode = this.getHttpStatus('SECURITY_THREAT');
    return error;
  }

  /**
   * 创建批量上传错误
   * Create batch upload error
   */
  static batchUploadFailed(failedCount: number, totalCount: number, errors: string[]): FileUploadError {
    const message = `批量上传失败: ${failedCount}/${totalCount} 个文件处理失败`;
    const error = new FileUploadError(message, 'BATCH_UPLOAD_FAILED');
    error.metadata = { failedCount, totalCount, errors };
    return error;
  }

  /**
   * 创建存储错误
   * Create storage error
   */
  static storageFailed(reason: string): FileUploadError {
    const message = `文件存储失败: ${reason}`;
    const error = new FileUploadError(message, 'STORAGE_FAILED');
    error.statusCode = 500;
    return error;
  }

  /**
   * 格式化字节数
   * Format bytes
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取用户友好的错误消息
   * Get user-friendly error message
   */
  getUserMessage(): string {
    const messageMap: Record<string, string> = {
      'FILE_TOO_LARGE': '上传的文件过大，请选择较小的文件',
      'INVALID_MIME_TYPE': '不支持的文件格式，请选择正确的文件类型',
      'INVALID_EXTENSION': '文件扩展名不正确',
      'INVALID_CONTENT': '文件内容格式不正确',
      'SECURITY_THREAT': '文件存在安全风险，已被拒绝上传',
      'UNSAFE_FILENAME': '文件名包含不安全的字符',
      'INVALID_PATH': '文件路径无效',
      'UPLOAD_FAILED': '文件上传失败，请重试',
      'PROCESSING_FAILED': '文件处理失败',
      'STORAGE_FAILED': '文件保存失败',
      'BATCH_UPLOAD_FAILED': '批量上传失败，部分文件未上传成功',
      'ACCESS_DENIED': '没有上传权限',
      'QUOTA_EXCEEDED': '超出上传配额',
    };

    return messageMap[this.uploadErrorCode] || this.message;
  }

  /**
   * 获取建议的解决方案
   * Get suggested solutions
   */
  getSuggestions(): string[] {
    const suggestionsMap: Record<string, string[]> = {
      'FILE_TOO_LARGE': [
        '压缩文件大小',
        '选择更小的文件',
        '联系管理员增加上传限制',
      ],
      'INVALID_MIME_TYPE': [
        '检查文件格式是否正确',
        '将文件转换为支持的格式',
        '查看支持的文件类型列表',
      ],
      'SECURITY_THREAT': [
        '扫描文件是否有病毒',
        '避免上传可疑文件',
        '联系技术支持',
      ],
      'UPLOAD_FAILED': [
        '检查网络连接',
        '稍后重试',
        '联系技术支持',
      ],
    };

    return suggestionsMap[this.uploadErrorCode] || ['请联系技术支持获取帮助'];
  }

  /**
   * 转换为客户端友好的响应
   * Convert to client-friendly response
   */
  toClientResponse() {
    return {
      status: 'error',
      message: this.getUserMessage(),
      errorCode: this.uploadErrorCode,
      suggestions: this.getSuggestions(),
      ...(this.metadata && { details: this.metadata }),
    };
  }
}
