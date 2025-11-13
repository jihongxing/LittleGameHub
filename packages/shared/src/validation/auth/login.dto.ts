/**
 * 用户登录 DTO
 */
import { IsEmail, IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeEmail } from '../common/sanitize';

export class LoginDto {
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(100, { message: '邮箱最多100个字符' })
  @Transform(({ value }) => sanitizeEmail(value))
  email: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码至少6个字符' })
  @MaxLength(128, { message: '密码最多128个字符' })
  password: string;
}

