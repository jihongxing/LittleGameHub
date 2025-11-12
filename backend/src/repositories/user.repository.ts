/**
 * User Repository
 * 用户仓库
 * 
 * 封装所有用户相关的数据库操作
 */

import { Repository } from 'typeorm'
import { User } from '../modules/users/entities/user.entity'
import { BaseRepository, PaginationParams, PaginationResult } from './base.repository'
import { AppDataSource } from '../config/database.config'

/**
 * 用户查询过滤条件
 */
export interface UserFilter {
  q?: string // 搜索关键词
  role?: string // 角色
  isActive?: boolean // 是否激活
  isEmailVerified?: boolean // 邮箱是否验证
}

/**
 * 用户仓库类
 */
export class UserRepository extends BaseRepository<User> {
  constructor(repository?: Repository<User>) {
    super(repository || AppDataSource.getRepository(User))
  }

  /**
   * 通过用户名查找用户
   */
  async findByUsername(username: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { nickname: username }
    })
  }

  /**
   * 通过邮箱查找用户
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { email }
    })
  }

  /**
   * 通过邮箱查找用户（包含密码字段）
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { email },
      select: {
        id: true,
        nickname: true,
        email: true,
        password_hash: true,
        avatar: true,
        role: true,
        is_active: true,
        is_email_verified: true,
        last_active_date: true
      }
    })
  }

  /**
   * 通过邮箱验证令牌查找用户
   */
  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { email_verification_token: token }
    })
  }

  /**
   * 通过密码重置令牌查找用户
   */
  async findByPasswordResetToken(token: string): Promise<User | null> {
    return await this.repository
      .createQueryBuilder('user')
      .where('user.password_reset_token = :token', { token })
      .andWhere('user.password_reset_expires > :now', { now: new Date() })
      .getOne()
  }

  /**
   * 获取用户列表（带过滤和分页）
   */
  async findUsersWithFilters(
    filters: UserFilter,
    pagination: PaginationParams
  ): Promise<PaginationResult<User>> {
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.nickname',
        'user.email',
        'user.avatar',
        'user.role',
        'user.is_active',
        'user.is_email_verified',
        'user.created_at',
        'user.updated_at'
      ])

    // 搜索关键词
    if (filters.q) {
      queryBuilder.andWhere(
        '(user.nickname LIKE :search OR user.email LIKE :search)',
        { search: `%${filters.q}%` }
      )
    }

    // 角色过滤
    if (filters.role) {
      queryBuilder.andWhere('user.role = :role', { role: filters.role })
    }

    // 是否激活过滤
    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('user.is_active = :isActive', { isActive: filters.isActive })
    }

    // 是否邮箱验证过滤
    if (filters.isEmailVerified !== undefined) {
      queryBuilder.andWhere('user.is_email_verified = :isEmailVerified', {
        isEmailVerified: filters.isEmailVerified
      })
    }

    // 分页
    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const skip = (page - 1) * limit

    queryBuilder
      .orderBy('user.created_at', 'DESC')
      .skip(skip)
      .take(limit)

    const [data, total] = await queryBuilder.getManyAndCount()

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
   * 通过ID查找用户（不包含密码）
   */
  async findByIdWithoutPassword(id: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { id },
      select: {
        id: true,
        nickname: true,
        email: true,
        avatar: true,
        role: true,
        is_active: true,
        is_email_verified: true,
        point_balance: true,
        membership_status: true,
        level: true,
        experience_points: true,
        created_at: true,
        updated_at: true
      }
    })
  }

  /**
   * 更新最后活跃时间
   */
  async updateLastActiveDate(userId: string): Promise<void> {
    await this.repository.update(
      { id: userId },
      { last_active_date: new Date() }
    )
  }

  /**
   * 切换用户激活状态
   */
  async toggleActiveStatus(userId: string): Promise<User | null> {
    const user = await this.findById(userId)
    if (!user) return null

    user.is_active = !user.is_active
    return await this.save(user) as User
  }

  /**
   * 更新用户密码
   */
  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.repository.update(
      { id: userId },
      { password_hash: passwordHash }
    )
  }

  /**
   * 设置密码重置令牌
   */
  async setPasswordResetToken(
    userId: string,
    token: string,
    expires: Date
  ): Promise<void> {
    await this.repository.update(
      { id: userId },
      {
        password_reset_token: token,
        password_reset_expires: expires
      }
    )
  }

  /**
   * 清除密码重置令牌
   */
  async clearPasswordResetToken(userId: string): Promise<void> {
    await this.repository.update(
      { id: userId },
      {
        password_reset_token: null,
        password_reset_expires: null
      }
    )
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(userId: string): Promise<void> {
    await this.repository.update(
      { id: userId },
      {
        is_email_verified: true,
        email_verification_token: null
      }
    )
  }

  /**
   * 更新邮箱验证令牌
   */
  async updateEmailVerificationToken(userId: string, token: string): Promise<void> {
    await this.repository.update(
      { id: userId },
      { email_verification_token: token }
    )
  }

  /**
   * 检查用户名是否存在
   */
  async isUsernameExists(username: string, excludeUserId?: string): Promise<boolean> {
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .where('user.nickname = :username', { username })

    if (excludeUserId) {
      queryBuilder.andWhere('user.id != :excludeUserId', { excludeUserId })
    }

    const count = await queryBuilder.getCount()
    return count > 0
  }

  /**
   * 检查邮箱是否存在
   */
  async isEmailExists(email: string, excludeUserId?: string): Promise<boolean> {
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })

    if (excludeUserId) {
      queryBuilder.andWhere('user.id != :excludeUserId', { excludeUserId })
    }

    const count = await queryBuilder.getCount()
    return count > 0
  }
}

// 导出单例实例
let userRepositoryInstance: UserRepository | null = null

export const getUserRepositoryInstance = (): UserRepository => {
  if (!userRepositoryInstance) {
    userRepositoryInstance = new UserRepository()
  }
  return userRepositoryInstance
}

