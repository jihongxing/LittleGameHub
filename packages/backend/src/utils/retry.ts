import { logger } from './logger';

/**
 * 重试选项
 * Retry Options
 */
export interface RetryOptions {
  /**
   * 最大重试次数
   */
  maxRetries: number;
  /**
   * 初始延迟时间（毫秒）
   */
  initialDelay: number;
  /**
   * 最大延迟时间（毫秒）
   */
  maxDelay: number;
  /**
   * 退避倍数
   */
  backoffMultiplier: number;
  /**
   * 判断是否应该重试的函数
   */
  shouldRetry?: (error: any) => boolean;
  /**
   * 重试前的回调
   */
  onRetry?: (error: any, attempt: number) => void;
}

/**
 * 默认重试选项
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  shouldRetry: () => true,
};

/**
 * 计算下一次重试的延迟时间（指数退避）
 * @param attempt 当前尝试次数
 * @param options 重试选项
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1);
  return Math.min(delay, options.maxDelay);
}

/**
 * 等待指定时间
 * @param ms 毫秒
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 带重试机制的异步函数执行器
 * Retry an async function with exponential backoff
 *
 * @param fn 要执行的异步函数
 * @param options 重试选项
 * @returns 函数执行结果
 *
 * @example
 * ```typescript
 * const result = await retry(async () => {
 *   return await database.query('SELECT * FROM users');
 * }, {
 *   maxRetries: 3,
 *   initialDelay: 1000,
 *   shouldRetry: (error) => error.code === 'ECONNREFUSED'
 * });
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 如果是最后一次尝试，或者不应该重试，直接抛出错误
      if (attempt > opts.maxRetries || !opts.shouldRetry?.(error)) {
        throw error;
      }

      // 计算延迟时间
      const delay = calculateDelay(attempt, opts);

      // 触发重试回调
      if (opts.onRetry) {
        opts.onRetry(error, attempt);
      }

      // 记录重试日志
      logger.warn(`重试操作 (${attempt}/${opts.maxRetries})，延迟 ${delay}ms`, {
        error: error instanceof Error ? error.message : String(error),
        attempt,
        delay,
      });

      // 等待后重试
      await sleep(delay);
    }
  }

  // 如果所有重试都失败，抛出最后一个错误
  throw lastError;
}

/**
 * 常见的数据库错误重试判断
 */
export function shouldRetryDatabaseError(error: any): boolean {
  // 连接错误
  if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
    return true;
  }

  // 超时错误
  if (error.code === 'ETIMEDOUT') {
    return true;
  }

  // 锁等待超时
  if (error.message?.includes('lock timeout') || error.message?.includes('deadlock')) {
    return true;
  }

  // PostgreSQL 特定错误
  // 40001 - serialization_failure
  // 40P01 - deadlock_detected
  if (error.code === '40001' || error.code === '40P01') {
    return true;
  }

  return false;
}

/**
 * 常见的网络错误重试判断
 */
export function shouldRetryNetworkError(error: any): boolean {
  // 网络连接错误
  if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // HTTP 状态码 429 (Too Many Requests) 或 5xx
  if (error.response?.status === 429 || (error.response?.status >= 500 && error.response?.status < 600)) {
    return true;
  }

  return false;
}

/**
 * 数据库操作重试装饰器
 * Database Operation Retry Decorator
 *
 * @example
 * ```typescript
 * class UserRepository {
 *   @withDatabaseRetry()
 *   async findById(id: string) {
 *     return await this.repository.findOne({ where: { id } });
 *   }
 * }
 * ```
 */
export function withDatabaseRetry(options: Partial<RetryOptions> = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return retry(
        () => originalMethod.apply(this, args),
        {
          maxRetries: 3,
          initialDelay: 500,
          maxDelay: 5000,
          backoffMultiplier: 2,
          shouldRetry: shouldRetryDatabaseError,
          ...options,
        }
      );
    };

    return descriptor;
  };
}

/**
 * 外部 API 调用重试装饰器
 * External API Call Retry Decorator
 *
 * @example
 * ```typescript
 * class PaymentService {
 *   @withApiRetry()
 *   async processPayment(orderId: string) {
 *     return await axios.post('/api/payment', { orderId });
 *   }
 * }
 * ```
 */
export function withApiRetry(options: Partial<RetryOptions> = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return retry(
        () => originalMethod.apply(this, args),
        {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
          shouldRetry: shouldRetryNetworkError,
          ...options,
        }
      );
    };

    return descriptor;
  };
}

