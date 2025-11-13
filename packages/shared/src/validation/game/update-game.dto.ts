/**
 * 更新游戏 DTO
 */
import {
  IsString,
  IsOptional,
  IsUrl,
  MaxLength,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeString, toBoolean } from '../common/sanitize';

export class UpdateGameDto {
  @IsOptional()
  @IsString({ message: '游戏标题必须是字符串' })
  @MaxLength(100, { message: '游戏标题最多100个字符' })
  @Transform(({ value }) => (value ? sanitizeString(value) : value))
  title?: string;

  @IsOptional()
  @IsString({ message: '游戏描述必须是字符串' })
  @MaxLength(1000, { message: '游戏描述最多1000个字符' })
  @Transform(({ value }) => (value ? sanitizeString(value) : value))
  description?: string;

  @IsOptional()
  @IsUrl({}, { message: '游戏URL格式不正确' })
  @MaxLength(500, { message: '游戏URL最多500个字符' })
  gameUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: '缩略图URL格式不正确' })
  @MaxLength(500, { message: '缩略图URL最多500个字符' })
  thumbnailUrl?: string;

  @IsOptional()
  @IsString({ message: '分类必须是字符串' })
  @MaxLength(50, { message: '分类最多50个字符' })
  @Transform(({ value }) => (value ? sanitizeString(value) : value))
  category?: string;

  @IsOptional()
  @IsString({ message: '标签必须是字符串' })
  @MaxLength(200, { message: '标签最多200个字符' })
  @Transform(({ value }) => (value ? sanitizeString(value) : value))
  tags?: string;

  @IsOptional()
  @IsString({ message: '状态必须是字符串' })
  @IsIn(['active', 'inactive', 'maintenance'], { message: '状态值无效' })
  availabilityStatus?: string;

  @IsOptional()
  @IsBoolean({ message: '是否精选必须是布尔值' })
  @Transform(({ value }) => toBoolean(value))
  isFeatured?: boolean;
}

