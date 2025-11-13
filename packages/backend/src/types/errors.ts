/**
 * 错误类型枚举
 * Error Type Enumeration
 */
export enum ErrorType {
  // 操作错误 - Operational Errors (可预见的、应该返回给客户端的)
  VALIDATION_ERROR = 'VALIDATION_ERROR',           // 验证错误
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',   // 认证错误
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',     // 授权错误
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',            // 资源未找到
  CONFLICT_ERROR = 'CONFLICT_ERROR',              // 冲突错误 (如唯一约束)
  BAD_REQUEST_ERROR = 'BAD_REQUEST_ERROR',        // 错误请求
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',          // 频率限制
  
  // 程序错误 - Programming Errors (不可预见的、不应返回详情给客户端的)
  DATABASE_ERROR = 'DATABASE_ERROR',              // 数据库错误
  INTERNAL_ERROR = 'INTERNAL_ERROR',              // 内部错误
  NETWORK_ERROR = 'NETWORK_ERROR',                // 网络错误
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',      // 外部 API 错误
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',        // 文件系统错误
}

/**
 * 错误严重程度
 * Error Severity
 */
export enum ErrorSeverity {
  LOW = 'low',           // 低 - 用户输入错误等
  MEDIUM = 'medium',     // 中 - 业务逻辑错误等
  HIGH = 'high',         // 高 - 数据库错误等
  CRITICAL = 'critical', // 严重 - 系统级错误
}

/**
 * 可重试的错误类型
 * Retriable Error Types
 */
export const RETRIABLE_ERROR_TYPES = [
  ErrorType.DATABASE_ERROR,
  ErrorType.NETWORK_ERROR,
  ErrorType.EXTERNAL_API_ERROR,
];

/**
 * 错误类型到 HTTP 状态码的映射
 * Error Type to HTTP Status Code Mapping
 */
export const ERROR_STATUS_CODES: Record<ErrorType, number> = {
  [ErrorType.VALIDATION_ERROR]: 400,
  [ErrorType.AUTHENTICATION_ERROR]: 401,
  [ErrorType.AUTHORIZATION_ERROR]: 403,
  [ErrorType.NOT_FOUND_ERROR]: 404,
  [ErrorType.CONFLICT_ERROR]: 409,
  [ErrorType.BAD_REQUEST_ERROR]: 400,
  [ErrorType.RATE_LIMIT_ERROR]: 429,
  [ErrorType.DATABASE_ERROR]: 500,
  [ErrorType.INTERNAL_ERROR]: 500,
  [ErrorType.NETWORK_ERROR]: 503,
  [ErrorType.EXTERNAL_API_ERROR]: 502,
  [ErrorType.FILE_SYSTEM_ERROR]: 500,
};

/**
 * 错误类型到严重程度的映射
 * Error Type to Severity Mapping
 */
export const ERROR_SEVERITY_MAP: Record<ErrorType, ErrorSeverity> = {
  [ErrorType.VALIDATION_ERROR]: ErrorSeverity.LOW,
  [ErrorType.AUTHENTICATION_ERROR]: ErrorSeverity.MEDIUM,
  [ErrorType.AUTHORIZATION_ERROR]: ErrorSeverity.MEDIUM,
  [ErrorType.NOT_FOUND_ERROR]: ErrorSeverity.LOW,
  [ErrorType.CONFLICT_ERROR]: ErrorSeverity.LOW,
  [ErrorType.BAD_REQUEST_ERROR]: ErrorSeverity.LOW,
  [ErrorType.RATE_LIMIT_ERROR]: ErrorSeverity.MEDIUM,
  [ErrorType.DATABASE_ERROR]: ErrorSeverity.HIGH,
  [ErrorType.INTERNAL_ERROR]: ErrorSeverity.CRITICAL,
  [ErrorType.NETWORK_ERROR]: ErrorSeverity.HIGH,
  [ErrorType.EXTERNAL_API_ERROR]: ErrorSeverity.MEDIUM,
  [ErrorType.FILE_SYSTEM_ERROR]: ErrorSeverity.HIGH,
};

