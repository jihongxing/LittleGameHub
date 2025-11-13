/**
 * Current User Decorator
 * Task: T024
 * 
 * Decorator to extract current authenticated user from request
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  userId: string;
  email?: string;
  phone?: string;
}

/**
 * @CurrentUser() decorator
 * Extracts authenticated user from request
 * 
 * Usage:
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: CurrentUserData) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext): CurrentUserData | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    // If specific property requested, return that
    if (data) {
      return user[data];
    }

    // Return full user object
    return user;
  }
);

/**
 * @UserId() decorator
 * Extracts only the user ID from request
 * 
 * Usage:
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@UserId() userId: string) {
 *   return this.userService.findById(userId);
 * }
 * ```
 */
export const UserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.userId || null;
  }
);
