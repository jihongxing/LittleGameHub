/**
 * 字段名转换工具
 * 用于前后端数据格式转换
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
 * 对象键名从 camelCase 转 snake_case
 */
export function objectToSnakeCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
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
 * 对象键名从 snake_case 转 camelCase
 */
export function objectToCamelCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
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
 * 批量转换 camelCase 字段到 snake_case
 */
export function convertFieldNames(
  fields: string[],
  converter: 'toSnake' | 'toCamel' = 'toSnake'
): string[] {
  const func = converter === 'toSnake' ? toSnakeCase : toCamelCase;
  return fields.map(func);
}

/**
 * 创建字段映射表
 */
export function createFieldMapping(fields: string[]): Record<string, string> {
  return fields.reduce((mapping, field) => {
    mapping[field] = toSnakeCase(field);
    return mapping;
  }, {} as Record<string, string>);
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

export default {
  toSnakeCase,
  toCamelCase,
  objectToSnakeCase,
  objectToCamelCase,
  convertFieldNames,
  createFieldMapping,
  isSnakeCase,
  isCamelCase,
};

