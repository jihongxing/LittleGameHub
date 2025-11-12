/**
 * Base Repository
 * 基础仓库类
 * 
 * 提供通用的数据访问方法，所有具体的 Repository 都应该继承此类
 */

import { Repository, FindOptionsWhere, FindManyOptions, DeepPartial, ObjectLiteral } from 'typeorm'

/**
 * 分页参数接口
 */
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * 分页结果接口
 */
export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * 基础仓库抽象类
 */
export abstract class BaseRepository<Entity extends ObjectLiteral> {
  constructor(protected repository: Repository<Entity>) {}

  /**
   * 查找单个实体
   */
  async findOne(options: FindManyOptions<Entity>): Promise<Entity | null> {
    return await this.repository.findOne(options)
  }

  /**
   * 查找所有符合条件的实体
   */
  async find(options?: FindManyOptions<Entity>): Promise<Entity[]> {
    return await this.repository.find(options)
  }

  /**
   * 查找并计数
   */
  async findAndCount(options?: FindManyOptions<Entity>): Promise<[Entity[], number]> {
    return await this.repository.findAndCount(options)
  }

  /**
   * 分页查询
   */
  async findWithPagination(
    options: FindManyOptions<Entity>,
    pagination: PaginationParams
  ): Promise<PaginationResult<Entity>> {
    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const skip = (page - 1) * limit

    const [data, total] = await this.repository.findAndCount({
      ...options,
      skip,
      take: limit
    })

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * 通过ID查找
   */
  async findById(id: string, options?: FindManyOptions<Entity>): Promise<Entity | null> {
    return await this.repository.findOne({
      ...options,
      where: { id } as any
    })
  }

  /**
   * 创建实体
   */
  create(data: DeepPartial<Entity>): Entity {
    return this.repository.create(data)
  }

  /**
   * 保存实体
   */
  async save(entity: Entity | Entity[]): Promise<Entity | Entity[]> {
    return await this.repository.save(entity as any)
  }

  /**
   * 更新实体
   */
  async update(
    criteria: FindOptionsWhere<Entity>,
    partialEntity: DeepPartial<Entity>
  ): Promise<void> {
    await this.repository.update(criteria, partialEntity as any)
  }

  /**
   * 删除实体
   */
  async remove(entity: Entity | Entity[]): Promise<Entity | Entity[]> {
    return await this.repository.remove(entity as any)
  }

  /**
   * 软删除（如果实体支持）
   */
  async softDelete(criteria: FindOptionsWhere<Entity>): Promise<void> {
    await this.repository.softDelete(criteria)
  }

  /**
   * 计数
   */
  async count(options?: FindManyOptions<Entity>): Promise<number> {
    return await this.repository.count(options)
  }

  /**
   * 检查是否存在
   */
  async exists(options: FindManyOptions<Entity>): Promise<boolean> {
    const count = await this.repository.count(options)
    return count > 0
  }
}

