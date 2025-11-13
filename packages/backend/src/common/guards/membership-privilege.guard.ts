/**
 * Membership Privilege Guard
 * Protects endpoints that require specific membership privileges
 * T104: Implement membership privilege middleware (ad-free, point multiplier)
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MembershipService } from '../../modules/membership/services/membership.service';
import { MembershipTier } from '../../modules/membership/entities/membership.entity';

// Decorator metadata keys
export const REQUIRED_MEMBERSHIP_KEY = 'requiredMembership';
export const REQUIRED_PRIVILEGE_KEY = 'requiredPrivilege';

// Decorators for use in controllers
export const RequireMembership = (tier: MembershipTier) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(REQUIRED_MEMBERSHIP_KEY, tier, descriptor.value);
    }
  };
};

export const RequirePrivilege = (privilege: string) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(REQUIRED_PRIVILEGE_KEY, privilege, descriptor.value);
    }
  };
};

@Injectable()
export class MembershipPrivilegeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private membershipService: MembershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required membership tier from metadata
    const requiredTier = this.reflector.get<MembershipTier>(
      REQUIRED_MEMBERSHIP_KEY,
      context.getHandler(),
    );

    // Get required privilege from metadata
    const requiredPrivilege = this.reflector.get<string>(
      REQUIRED_PRIVILEGE_KEY,
      context.getHandler(),
    );

    // If no requirements, allow access
    if (!requiredTier && !requiredPrivilege) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('Authentication required');
    }

    const userId = user.id || user.sub;

    // Check membership tier requirement
    if (requiredTier) {
      const userTier = await this.membershipService.getMembershipTier(userId);
      if (!userTier) {
        throw new ForbiddenException(`This feature requires ${requiredTier} membership or higher`);
      }
      const hasRequiredTier = this.compareTiers(userTier, requiredTier);

      if (!hasRequiredTier) {
        throw new ForbiddenException(
          `This feature requires ${requiredTier} membership or higher`
        );
      }
    }

    // Check privilege requirement
    if (requiredPrivilege) {
      const hasPrivilege = await this.membershipService.hasPrivilege(userId, requiredPrivilege);

      if (!hasPrivilege) {
        throw new ForbiddenException(
          `This feature requires the '${requiredPrivilege}' privilege`
        );
      }
    }

    return true;
  }

  /**
   * Compare membership tiers (higher tier >= required tier)
   */
  private compareTiers(userTier: MembershipTier, requiredTier: MembershipTier): boolean {
    const tierLevels: Record<MembershipTier, number> = {
      [MembershipTier.BASIC]: 1,
      [MembershipTier.PREMIUM]: 2,
      [MembershipTier.VIP]: 3,
    };

    return tierLevels[userTier] >= tierLevels[requiredTier];
  }
}

