/**
 * 分页参数接口
 */
export interface PaginationOptions {
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
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * 获取分页参数
 */
export const getPaginationParams = (query: any): PaginationOptions => {
  const page = parseInt(query.page) || 1
  const limit = parseInt(query.limit) || 10
  const sortBy = query.sortBy || 'createdAt'
  const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC'

  return {
    page,
    limit,
    sortBy,
    sortOrder
  }
}

/**
 * 计算分页偏移量
 */
export const calculateOffset = (page: number, limit: number): number => {
  return (page - 1) * limit
}

/**
 * 格式化分页结果
 */
export const formatPaginationResult = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> => {
  const totalPages = Math.ceil(total / limit)
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }
}

/**
 * 构建Sequelize查询选项
 */
export const buildSequelizeQueryOptions = (
  pagination: PaginationOptions,
  additionalOptions: any = {}
) => {
  const { page, limit, sortBy, sortOrder } = pagination
  
  const options: any = {
    ...additionalOptions,
    offset: calculateOffset(page || 1, limit || 10),
    limit: limit || 10,
    order: [[sortBy || 'createdAt', sortOrder || 'DESC']]
  }
  
  return options
}