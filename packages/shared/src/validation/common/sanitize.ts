/**
 * 数据清洗和转换工具
 */
import DOMPurify from 'isomorphic-dompurify';

/**
 * 清洗字符串，防止 XSS 攻击
 */
export function sanitizeString(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const str = String(value).trim();
  return DOMPurify.sanitize(str, {
    ALLOWED_TAGS: [], // 不允许任何 HTML 标签
    ALLOWED_ATTR: [],
  });
}

/**
 * 清洗并转换为小写
 */
export function sanitizeAndLowercase(value: any): string {
  return sanitizeString(value).toLowerCase();
}

/**
 * 清洗邮箱地址
 */
export function sanitizeEmail(value: any): string {
  return sanitizeAndLowercase(value);
}

/**
 * 转换为正整数
 */
export function toPositiveInteger(value: any, defaultValue: number = 1): number {
  const num = parseInt(String(value), 10);
  if (isNaN(num) || num < 1) {
    return defaultValue;
  }
  return num;
}

/**
 * 转换为布尔值
 */
export function toBoolean(value: any): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  return Boolean(value);
}

/**
 * 限制字符串长度
 */
export function limitStringLength(value: string, maxLength: number): string {
  if (!value || typeof value !== 'string') {
    return '';
  }
  return value.slice(0, maxLength);
}

/**
 * 移除危险字符
 */
export function removeDangerousChars(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }
  // 移除可能导致 SQL 注入的字符
  return value.replace(/['";<>]/g, '');
}

