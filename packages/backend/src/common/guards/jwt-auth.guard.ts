/**
 * JWT Authentication Guard
 * Task: T023
 * 
 * NestJS guard for protecting routes with JWT authentication
 */

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { env } from '../../config/env';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      // Extract token from Authorization header
      const authHeader = request.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('No token provided');
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token
      const payload = jwt.verify(token, env.JWT_SECRET) as any;

      // Attach user info to request
      request.user = {
        id: payload.id,
        userId: payload.id, // 兼容性
        email: payload.email,
        role: payload.role,
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
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = jwt.verify(token, env.JWT_SECRET) as any;
        request.user = {
          userId: payload.userId,
          email: payload.email,
          phone: payload.phone,
        };
      } else {
        request.user = null;
      }

      return true;
    } catch {
      // Silently fail - user just won't be authenticated
      request.user = null;
      return true;
    }
  }
}
