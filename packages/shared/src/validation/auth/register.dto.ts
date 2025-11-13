/**
 * 用户注册 DTO
 */
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsStrongPassword, IsValidUsername } from '../common/decorators';
import { sanitizeString, sanitizeEmail } from '../common/sanitize';

export class RegisterDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名至少3个字符' })
  @MaxLength(20, { message: '用户名最多20个字符' })
  @IsValidUsername({ message: '用户名只能包含字母、数字和下划线' })
  @Transform(({ value }) => sanitizeString(value))
  nickname: string;

  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(100, { message: '邮箱最多100个字符' })
  @Transform(({ value }) => sanitizeEmail(value))
  email: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码至少8个字符' })
  @MaxLength(128, { message: '密码最多128个字符' })
  @IsStrongPassword({
    message: '密码必须至少8个字符，包含大小写字母、数字和特殊字符(@$!%*?&)',
  })
  password: string;
}

