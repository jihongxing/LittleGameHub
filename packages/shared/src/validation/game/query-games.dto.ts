/**
 * 查询游戏列表 DTO
 */
import { IsOptional, IsString, IsIn, MaxLength, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsValidPage, IsValidPageSize } from '../common/decorators';
import { toPositiveInteger, sanitizeString } from '../common/sanitize';
import { SortOrder } from '../common/pagination.dto';

export enum GameSortBy {
  CREATED_AT = 'created_at',
  PLAY_COUNT = 'play_count',
  RATING = 'rating',
  TITLE = 'title',
}

export class QueryGamesDto {
  @IsOptional()
  @IsValidPage({ message: '页码必须是大于等于1的整数' })
  @Transform(({ value }) => toPositiveInteger(value, 1))
  page?: number = 1;

  @IsOptional()
  @IsValidPageSize({ message: '每页数量必须是1-100之间的整数' })
  @Transform(({ value }) => toPositiveInteger(value, 20))
  limit?: number = 20;

  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  @MaxLength(100, { message: '搜索关键词最多100个字符' })
  @Transform(({ value }) => (value ? sanitizeString(value) : undefined))
  search?: string;

  @IsOptional()
  @IsString({ message: '分类必须是字符串' })
  @MaxLength(50, { message: '分类最多50个字符' })
  @Transform(({ value }) => (value ? sanitizeString(value) : undefined))
  category?: string;

  @IsOptional()
  @IsString({ message: '标签必须是字符串' })
  @MaxLength(50, { message: '标签最多50个字符' })
  @Transform(({ value }) => (value ? sanitizeString(value) : undefined))
  tag?: string;

  @IsOptional()
  @IsEnum(GameSortBy, { message: '排序字段无效' })
  sortBy?: GameSortBy = GameSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder, { message: '排序方向无效' })
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsString({ message: '状态必须是字符串' })
  @IsIn(['active', 'inactive', 'maintenance'], { message: '状态值无效' })
  status?: string;
}

