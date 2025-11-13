/**
 * 更新用户资料 DTO
 */
import { IsString, IsOptional, MinLength, MaxLength, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsValidUsername } from '../common/decorators';
import { sanitizeString } from '../common/sanitize';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名至少3个字符' })
  @MaxLength(20, { message: '用户名最多20个字符' })
  @IsValidUsername({ message: '用户名只能包含字母、数字和下划线' })
  @Transform(({ value }) => (value ? sanitizeString(value) : value))
  nickname?: string;

  @IsOptional()
  @IsString({ message: '电话必须是字符串' })
  @MinLength(11, { message: '电话至少11个字符' })
  @MaxLength(11, { message: '电话最多11个字符' })
  @Transform(({ value }) => (value ? sanitizeString(value) : value))
  phone?: string;

  @IsOptional()
  @IsUrl({}, { message: '头像URL格式不正确' })
  @MaxLength(500, { message: '头像URL最多500个字符' })
  avatar_url?: string;
}

