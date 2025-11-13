/**
 * JWT Authentication Guard
 * JWT 认证守卫
 * 
 * This guard provides JWT-based authentication for NestJS routes.
 * It validates JWT tokens and attaches user information to the request.
 * 
 * 此守卫为 NestJS 路由提供基于 JWT 的身份验证。
 * 它验证 JWT 令牌并将用户信息附加到请求中。
 * 
 * @author GameHub Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  /**
   * Validate JWT token and authenticate user
   * 验证 JWT 令牌并认证用户
   * 
   * @param context - Execution context
   *                  执行上下文
   * @returns Promise<boolean> - Authentication result
   *                             认证结果
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = this.extractTokenFromHeader(request)
    
    if (!token) {
      throw new UnauthorizedException('Access token is required')
    }

    try {
      const payload = await this.jwtService.verifyAsync(token)
      // Attach user payload to request
      // 将用户载荷附加到请求中
      request['user'] = payload
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token')
    }
    
    return true
  }

  /**
   * Extract JWT token from Authorization header
   * 从 Authorization 头部提取 JWT 令牌
   * 
   * @param request - HTTP request object
   *                  HTTP 请求对象
   * @returns string | undefined - Extracted token
   *                                提取的令牌
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
