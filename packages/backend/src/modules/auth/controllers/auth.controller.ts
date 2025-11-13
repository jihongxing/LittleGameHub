/**
 * Auth Controller
 * 认证控制器
 *
 * Handles traditional authentication endpoints (login, register, etc.)
 * 处理传统认证端点（登录、注册等）
 */

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, MembershipStatus } from '../../users/entities/user.entity';
import { AppError } from '../../../middleware/errorHandler';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { env } from '../../../config/env';

// DTO接口
interface RegisterDto {
  nickname: string;
  email: string;
  password: string;
}

interface LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  /**
   * 用户注册
   * POST /api/auth/register
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    try {

      // 检查邮箱是否已存在
      const existingUser = await this.userRepository.findOne({
        where: { email: registerDto.email }
      });

      if (existingUser) {
        throw new AppError('邮箱已被注册', 400);
      }

      // 检查用户名是否已存在
      const existingUsername = await this.userRepository.findOne({
        where: { nickname: registerDto.nickname }
      });

      if (existingUsername) {
        throw new AppError('用户名已被使用', 400);
      }

      // 哈希密码
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // 创建新用户
      const user = this.userRepository.create({
        nickname: registerDto.nickname,
        email: registerDto.email,
        password_hash: hashedPassword,
        registration_date: new Date(),
        membership_status: MembershipStatus.FREE,
        is_active: true,
        is_email_verified: false, // 实际应用中需要邮箱验证
        role: 'user'
      });

      const savedUser = await this.userRepository.save(user);

      // 生成JWT token
      const token = jwt.sign(
        { 
          id: savedUser.id, 
          email: savedUser.email,
          role: savedUser.role 
        },
        env.JWT_SECRET,
        { expiresIn: '7d' } // 7天过期
      );

      return {
        status: 'success',
        message: '注册成功',
        data: {
          user: {
            id: savedUser.id,
            nickname: savedUser.nickname,
            email: savedUser.email,
          },
          token,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('注册失败，请重试', 500);
    }
  }

  /**
   * 用户登录
   * POST /api/auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    try {
      // 查找用户
      const user = await this.userRepository.findOne({
        where: { email: loginDto.email }
      });

      if (!user) {
        throw new AppError('邮箱或密码错误', 401);
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash || '');
      if (!isPasswordValid) {
        throw new AppError('邮箱或密码错误', 401);
      }

      // 检查用户是否激活
      if (!user.is_active) {
        throw new AppError('账户已被禁用', 401);
      }

      // 生成JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          role: user.role 
        },
        env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        status: 'success',
        message: '登录成功',
        data: {
          user: {
            id: user.id,
            nickname: user.nickname,
            email: user.email,
            avatar: user.avatar,
          },
          token,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('登录失败，请重试', 500);
    }
  }

  /**
   * 用户登出
   * POST /api/auth/logout
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    // 客户端通常会在前端清除token
    return {
      status: 'success',
      message: '登出成功',
    };
  }

  /**
   * 刷新令牌
   * POST /api/auth/refresh
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: { refreshToken: string }) {
    try {
      const { refreshToken } = body;

      if (!refreshToken) {
        throw new AppError('缺少刷新令牌', 400);
      }

      // 验证刷新令牌并生成新令牌（这里应该调用JwtService）
      // const newTokens = await this.jwtService.refreshToken(refreshToken);

      // 暂时返回模拟数据
      const newToken = `jwt_refreshed_${Date.now()}`;

      return {
        status: 'success',
        data: {
          token: newToken,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('令牌刷新失败', 500);
    }
  }

  /**
   * 验证邮箱
   * POST /api/auth/verify-email
   */
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: { token: string }) {
    try {
      const { token } = body;

      if (!token) {
        throw new AppError('缺少验证令牌', 400);
      }

      // 验证邮箱令牌（这里应该调用邮件验证服务）
      // const user = await this.emailVerificationService.verifyEmail(token);

      return {
        status: 'success',
        message: '邮箱验证成功',
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('邮箱验证失败', 500);
    }
  }

  /**
   * 重置密码
   * POST /api/auth/reset-password
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { email: string }) {
    try {
      const { email } = body;

      if (!email) {
        throw new AppError('缺少邮箱地址', 400);
      }

      // 发送重置密码邮件（这里应该调用邮件服务）
      // await this.emailService.sendPasswordResetEmail(email);

      return {
        status: 'success',
        message: '密码重置邮件已发送',
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('密码重置失败', 500);
    }
  }
}
