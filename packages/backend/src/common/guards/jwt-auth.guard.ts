/**
 * JWT Authentication Guard
 * Task: T023
 * 
 * NestJS guard for protecting routes with JWT authentication
 */

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '../../modules/auth/services/jwt.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      // Extract token from Authorization header
      const authHeader = request.headers.authorization;
      const token = JwtService.extractTokenFromHeader(authHeader);

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // Verify token
      const payload = JwtService.verifyAccessToken(token);

      // Attach user info to request
      request.user = {
        userId: payload.userId,
        email: payload.email,
        phone: payload.phone,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

/**
 * Optional JWT Auth Guard - doesn't throw if no token provided
 * Useful for routes that work with or without authentication
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    try {
      const authHeader = request.headers.authorization;
      const token = JwtService.extractTokenFromHeader(authHeader);

      if (token) {
        const payload = JwtService.verifyAccessToken(token);
        request.user = {
          userId: payload.userId,
          email: payload.email,
          phone: payload.phone,
        };
      }

      return true;
    } catch {
      // Silently fail - user just won't be authenticated
      request.user = null;
      return true;
    }
  }
}
