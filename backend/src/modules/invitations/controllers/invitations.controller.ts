/**
 * Invitations Controller
 * Handles HTTP requests for invitation management
 * T127: Implement GET /invitations endpoint
 * T128: Implement POST /invitations/generate endpoint
 */

import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { InvitationService } from '../services/invitation.service';
import { InvitationRewardService } from '../services/invitation-reward.service';
import { InvitationValidationService } from '../services/invitation-validation.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { InvitationStatus } from '../entities/invitation.entity';

@Controller('invitations')
export class InvitationsController {
  constructor(
    private readonly invitationService: InvitationService,
    private readonly rewardService: InvitationRewardService,
    private readonly validationService: InvitationValidationService,
  ) {}

  /**
   * T128: POST /invitations/generate - Generate new invitation link
   */
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async generateInvitation(@CurrentUser() user: any) {
    const userId = user.id || user.sub;

    // Check if user can generate invitation
    const validation = await this.validationService.canUserGenerateInvitation(userId);
    if (!validation.valid) {
      return { error: validation.message };
    }

    // Generate invitation
    const invitation = await this.invitationService.generateInvitation(userId);

    return invitation;
  }

  /**
   * T127: GET /invitations - Get user's invitations
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUserInvitations(
    @CurrentUser() user: any,
    @Query('status') status?: InvitationStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = user.id || user.sub;

    const { invitations, total } = await this.invitationService.getUserInvitations(userId, {
      status,
      page: page ? parseInt(String(page)) : 1,
      limit: limit ? parseInt(String(limit)) : 20,
    });

    return {
      invitations: invitations.map((inv) => inv.toJSON()),
      pagination: {
        page: page || 1,
        limit: limit || 20,
        total,
        total_pages: Math.ceil(total / (limit || 20)),
      },
    };
  }

  /**
   * GET /invitations/stats - Get user's invitation statistics
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getInvitationStats(@CurrentUser() user: any) {
    const userId = user.id || user.sub;
    return this.invitationService.getUserInvitationStats(userId);
  }

  /**
   * GET /invitations/leaderboard - Get top inviters
   */
  @Get('leaderboard')
  @HttpCode(HttpStatus.OK)
  async getLeaderboard(@Query('limit') limit?: number) {
    const leaderboard = await this.invitationService.getTopInviters(
      limit ? parseInt(String(limit)) : 10,
    );

    return { leaderboard };
  }

  /**
   * GET /invitations/rewards - Get reward milestones
   */
  @Get('rewards')
  @HttpCode(HttpStatus.OK)
  getRewardMilestones() {
    const milestones = this.rewardService.getRewardMilestones();
    const totalPotential = this.rewardService.getTotalPotentialRewards();

    return {
      milestones,
      total_potential_rewards: totalPotential,
    };
  }

  /**
   * GET /invitations/qr/:code - Generate QR code for invitation
   */
  @Get('qr/:code')
  @HttpCode(HttpStatus.OK)
  async getQRCode(@Param('code') code: string, @Res() res: Response) {
    // In production, use a QR code generation library like qrcode
    // For MVP, redirect to invitation link
    const invitation = await this.invitationService.getInvitationByCode(code);

    if (!invitation) {
      res.status(404).send('Invitation not found');
      return;
    }

    // Simple SVG QR code placeholder
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" fill="black" font-size="14">
          QR Code
        </text>
        <text x="100" y="120" text-anchor="middle" fill="black" font-size="10">
          ${code}
        </text>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  }

  /**
   * GET /invitations/validate/:code - Validate invitation code
   */
  @Get('validate/:code')
  @HttpCode(HttpStatus.OK)
  async validateInvitationCode(@Param('code') code: string) {
    const invitation = await this.invitationService.getInvitationByCode(code);

    if (!invitation) {
      return {
        valid: false,
        message: 'Invitation code not found',
      };
    }

    return {
      valid: invitation.isValid(),
      message: invitation.isValid() ? 'Invitation is valid' : 'Invitation is expired or already used',
      invitation: invitation.isValid() ? invitation.toJSON() : undefined,
    };
  }
}

