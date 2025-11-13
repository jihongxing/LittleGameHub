/**
 * OAuth Controller
 * OAuth 控制器
 *
 * Handles OAuth authentication endpoints
 * 处理OAuth认证端点
 */

import { Controller, Get, Post, Query, Body, Req, Res, UseGuards, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OAuthBackendService } from '../services/oauth.service';
import { catchAsync, AppError } from '../../../middleware';

@Controller('auth/oauth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthBackendService) {}

  /**
   * 发起OAuth登录
   * GET /api/auth/oauth/:provider
   */
  @Get(':provider')
  async initiateOAuth(
    @Req() req: Request,
    @Res() res: Response,
    @Query('provider') provider: string,
  ) {
    try {
      const { url, state } = await this.oauthService.getAuthorizationUrl(provider);

      // 将state存储在session或缓存中（这里暂时使用简单的内存存储）
      // 在生产环境中应该使用Redis或其他持久化存储
      (global as any).oauthStates = (global as any).oauthStates || new Map();
      (global as any).oauthStates.set(state, { provider, expiresAt: Date.now() + 10 * 60 * 1000 });

      // 重定向到OAuth提供商
      res.redirect(url);
    } catch (error) {
      console.error('OAuth initiation failed:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to initiate OAuth login',
      });
    }
  }

  /**
   * 处理OAuth回调
   * GET /api/auth/oauth/callback/:provider
   */
  @Get('callback/:provider')
  async handleOAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Query('provider') provider: string,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
    @Query('error_description') errorDescription?: string,
  ) {
    try {
      // 检查是否有错误
      if (error) {
        const errorMsg = errorDescription || `OAuth ${provider} authentication failed: ${error}`;
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent(errorMsg)}`);
      }

      // 验证必需参数
      if (!code || !state) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent('Missing OAuth parameters')}`);
      }

      // 验证state参数
      const storedState = (global as any).oauthStates?.get(state);
      if (!storedState || storedState.provider !== provider) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent('Invalid OAuth state')}`);
      }

      // 处理OAuth回调
      const result = await this.oauthService.handleOAuthCallback(provider, code, state);

      // 生成JWT token（这里需要调用auth service来生成token）
      // 暂时使用简单的token，实际应该调用JwtService
      const token = `oauth_${result.user.id}_${Date.now()}`;

      // 清理state
      (global as any).oauthStates?.delete(state);

      // 重定向到前端，带上token
      const redirectUrl = result.isNewUser
        ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/welcome?token=${token}`
        : `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?token=${token}`;

      res.redirect(redirectUrl);

    } catch (error) {
      console.error('OAuth callback failed:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent('OAuth authentication failed')}`);
    }
  }

  /**
   * 获取用户的OAuth连接状态
   * GET /api/auth/oauth/connections
   */
  @Get('connections')
  @UseGuards(JwtAuthGuard)
  async getOAuthConnections(@Req() req: Request) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const connections = await this.oauthService.getOAuthConnections(userId);

      return {
        status: 'success',
        data: {
          connections: connections.map(conn => ({
            provider: conn.auth_type,
            displayName: conn.getDisplayName(),
            email: conn.email,
            connected: true,
            lastLoginAt: conn.last_login_at,
            isPrimary: conn.is_primary,
          })),
        },
      };
    } catch (error) {
      throw new AppError('Failed to get OAuth connections', 500);
    }
  }

  /**
   * 断开OAuth连接
   * POST /api/auth/oauth/disconnect
   */
  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  async disconnectOAuth(
    @Req() req: Request,
    @Body() body: { provider: string }
  ) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { provider } = body;
      if (!provider) {
        throw new AppError('Provider is required', 400);
      }

      await this.oauthService.disconnectOAuth(userId, provider);

      return {
        status: 'success',
        message: 'OAuth connection disconnected successfully',
      };
    } catch (error) {
      throw new AppError('Failed to disconnect OAuth connection', 500);
    }
  }

  /**
   * 设置主登录方式
   * POST /api/auth/oauth/set-primary
   */
  @Post('set-primary')
  @UseGuards(JwtAuthGuard)
  async setPrimaryAuthMethod(
    @Req() req: Request,
    @Body() body: { provider: string }
  ) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { provider } = body;
      if (!provider) {
        throw new AppError('Provider is required', 400);
      }

      await this.oauthService.setPrimaryAuthMethod(userId, provider);

      return {
        status: 'success',
        message: 'Primary authentication method updated successfully',
      };
    } catch (error) {
      throw new AppError('Failed to set primary authentication method', 500);
    }
  }
}
