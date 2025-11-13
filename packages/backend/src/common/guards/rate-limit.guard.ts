/**
 * Rate Limiting Guard (T246)
 * Prevent abuse and DDoS attacks
 */

import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

interface RateLimitConfig {
  ttl: number; // Time window in seconds
  limit: number; // Max requests per window
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private requests: Map<string, number[]> = new Map();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = this.getKey(request);

    // Get rate limit config from decorator or use default
    const config: RateLimitConfig = this.reflector.get<RateLimitConfig>(
      'rateLimit',
      context.getHandler(),
    ) || { ttl: 60, limit: 100 };

    const now = Date.now();
    const windowStart = now - (config.ttl * 1000);

    // Get existing requests for this key
    let timestamps = this.requests.get(key) || [];

    // Remove expired timestamps
    timestamps = timestamps.filter(ts => ts > windowStart);

    // Check if limit exceeded
    if (timestamps.length >= config.limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfter: config.ttl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add current timestamp
    timestamps.push(now);
    this.requests.set(key, timestamps);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return true;
  }

  private getKey(request: any): string {
    // Use IP address + user ID (if authenticated) as key
    const ip = request.ip || request.connection.remoteAddress;
    const userId = request.user?.id || 'anonymous';
    return `${ip}:${userId}`;
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(ts => ts > now - maxAge);
      
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }
}

/**
 * Rate Limit Decorator
 * Usage: @RateLimit({ ttl: 60, limit: 10 })
 */
export function RateLimit(config: RateLimitConfig) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('rateLimit', config, descriptor.value);
    return descriptor;
  };
}

