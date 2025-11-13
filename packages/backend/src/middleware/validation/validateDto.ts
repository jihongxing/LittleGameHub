/**
 * DTO 验证中间件
 * 使用 class-validator 验证请求数据
 */
import { Request, Response, NextFunction } from 'express';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { AppError } from '../errorHandler';

/**
 * 验证位置
 */
export enum ValidateSource {
  BODY = 'body',
  QUERY = 'query',
  PARAMS = 'params',
}

/**
 * 格式化验证错误消息
 */
function formatValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];

  function extractErrors(error: ValidationError, parentPath: string = '') {
    const propertyPath = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      Object.values(error.constraints).forEach((message) => {
        messages.push(message);
      });
    }

    if (error.children && error.children.length > 0) {
      error.children.forEach((childError) => {
        extractErrors(childError, propertyPath);
      });
    }
  }

  errors.forEach((error) => extractErrors(error));
  return messages;
}

/**
 * 创建 DTO 验证中间件
 * @param dtoClass DTO 类
 * @param source 验证数据来源（body, query, params）
 * @param skipMissingProperties 是否跳过缺失属性的验证
 */
export function validateDto(
  dtoClass: any,
  source: ValidateSource = ValidateSource.BODY,
  skipMissingProperties: boolean = false
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 获取要验证的数据
      const dataToValidate = req[source];

      // 转换为 DTO 实例
      const dtoInstance = plainToClass(dtoClass, dataToValidate);

      // 执行验证
      const errors = await validate(dtoInstance, {
        skipMissingProperties,
        whitelist: true, // 自动移除不在 DTO 中定义的属性
        forbidNonWhitelisted: true, // 如果存在未定义的属性，抛出错误
      });

      // 如果有验证错误
      if (errors.length > 0) {
        const errorMessages = formatValidationErrors(errors);
        return next(
          new AppError(
            `验证失败: ${errorMessages.join('; ')}`,
            400
          )
        );
      }

      // 将验证后的 DTO 实例替换原始数据
      req[source] = dtoInstance;

      next();
    } catch (error) {
      next(
        new AppError(
          '数据验证时发生错误',
          500
        )
      );
    }
  };
}

/**
 * 验证 body 的便捷方法
 */
export function validateBody(dtoClass: any) {
  return validateDto(dtoClass, ValidateSource.BODY);
}

/**
 * 验证 query 的便捷方法
 */
export function validateQuery(dtoClass: any) {
  return validateDto(dtoClass, ValidateSource.QUERY, true);
}

/**
 * 验证 params 的便捷方法
 */
export function validateParams(dtoClass: any) {
  return validateDto(dtoClass, ValidateSource.PARAMS);
}

