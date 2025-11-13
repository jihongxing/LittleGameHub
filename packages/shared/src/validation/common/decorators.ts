/**
 * 通用验证装饰器
 */
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * 验证密码强度
 * 要求：至少8个字符，包含大小写字母、数字和特殊字符
 */
@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    if (!password || typeof password !== 'string') {
      return false;
    }

    // 至少8个字符
    if (password.length < 8) {
      return false;
    }

    // 包含小写字母
    if (!/[a-z]/.test(password)) {
      return false;
    }

    // 包含大写字母
    if (!/[A-Z]/.test(password)) {
      return false;
    }

    // 包含数字
    if (!/\d/.test(password)) {
      return false;
    }

    // 包含特殊字符
    if (!/[@$!%*?&]/.test(password)) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return '密码必须至少8个字符，包含大小写字母、数字和特殊字符(@$!%*?&)';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

/**
 * 验证用户名格式
 * 只允许字母、数字和下划线
 */
@ValidatorConstraint({ name: 'isValidUsername', async: false })
export class IsValidUsernameConstraint implements ValidatorConstraintInterface {
  validate(username: string, args: ValidationArguments) {
    if (!username || typeof username !== 'string') {
      return false;
    }
    return /^[a-zA-Z0-9_]+$/.test(username);
  }

  defaultMessage(args: ValidationArguments) {
    return '用户名只能包含字母、数字和下划线';
  }
}

export function IsValidUsername(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidUsernameConstraint,
    });
  };
}

/**
 * 验证分页页码
 */
@ValidatorConstraint({ name: 'isValidPage', async: false })
export class IsValidPageConstraint implements ValidatorConstraintInterface {
  validate(page: any, args: ValidationArguments) {
    const pageNum = Number(page);
    return !isNaN(pageNum) && pageNum >= 1 && Number.isInteger(pageNum);
  }

  defaultMessage(args: ValidationArguments) {
    return '页码必须是大于等于1的整数';
  }
}

export function IsValidPage(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPageConstraint,
    });
  };
}

/**
 * 验证分页大小
 */
@ValidatorConstraint({ name: 'isValidPageSize', async: false })
export class IsValidPageSizeConstraint implements ValidatorConstraintInterface {
  validate(limit: any, args: ValidationArguments) {
    const limitNum = Number(limit);
    return !isNaN(limitNum) && limitNum >= 1 && limitNum <= 100 && Number.isInteger(limitNum);
  }

  defaultMessage(args: ValidationArguments) {
    return '每页数量必须是1-100之间的整数';
  }
}

export function IsValidPageSize(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPageSizeConstraint,
    });
  };
}

