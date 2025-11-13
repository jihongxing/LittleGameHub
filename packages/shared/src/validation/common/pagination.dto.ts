/**
 * 通用分页查询 DTO
 */
import { IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsValidPage, IsValidPageSize } from './decorators';
import { toPositiveInteger } from './sanitize';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginationDto {
  @IsOptional()
  @IsValidPage({ message: '页码必须是大于等于1的整数' })
  @Transform(({ value }) => toPositiveInteger(value, 1))
  page?: number = 1;

  @IsOptional()
  @IsValidPageSize({ message: '每页数量必须是1-100之间的整数' })
  @Transform(({ value }) => toPositiveInteger(value, 20))
  limit?: number = 20;

  @IsOptional()
  @IsEnum(SortOrder, { message: '排序方向无效' })
  sortOrder?: SortOrder = SortOrder.DESC;
}

