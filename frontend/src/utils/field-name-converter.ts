/**
 * 前端字段名转换工具
 * 用于 API 响应数据格式转换
 */

/**
 * CamelCase 转 snake_case
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, (letter) => `_${letter.toLowerCase()}`)
    .replace(/^_/, '');
}

/**
 * snake_case 转 CamelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 对象键名从 snake_case 转 camelCase
 * 用于处理 API 响应
 */
export function objectToCamelCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Date) {
    return obj as any;
  }

  if (Array.isArray(obj)) {
    return obj.map(objectToCamelCase) as any;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = toCamelCase(key);
      result[camelKey] = objectToCamelCase(obj[key]);
      return result;
    }, {} as any) as T;
  }

  return obj;
}

/**
 * 对象键名从 camelCase 转 snake_case
 * 用于发送 API 请求
 */
export function objectToSnakeCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Date) {
    return obj as any;
  }

  if (Array.isArray(obj)) {
    return obj.map(objectToSnakeCase) as any;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = toSnakeCase(key);
      result[snakeKey] = objectToSnakeCase(obj[key]);
      return result;
    }, {} as any) as T;
  }

  return obj;
}

/**
 * 验证字段名是否为 snake_case
 */
export function isSnakeCase(str: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(str);
}

/**
 * 验证字段名是否为 camelCase
 */
export function isCamelCase(str: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(str);
}

/**
 * 批量转换字段名
 */
export function convertFields(
  fields: string[],
  direction: 'toCamel' | 'toSnake' = 'toCamel'
): string[] {
  const converter = direction === 'toCamel' ? toCamelCase : toSnakeCase;
  return fields.map(converter);
}

export default {
  toSnakeCase,
  toCamelCase,
  objectToCamelCase,
  objectToSnakeCase,
  isSnakeCase,
  isCamelCase,
  convertFields,
};

