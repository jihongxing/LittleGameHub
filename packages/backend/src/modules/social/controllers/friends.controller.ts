/**
 * Friends Controller (User Story 6)
 * T162, T163: API endpoints for friend management
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { FriendService } from '../services/friend.service';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FriendshipStatus } from '../entities/friend-relationship.entity';

// DTOs
export class SendFriendRequestDto {
  friend_id: number;
  message?: string;
}

export class UpdateNicknameDto {
  nickname: string;
}

export class GetFriendsQueryDto {
  status?: FriendshipStatus;
  page?: number;
  limit?: number;
  search?: string;
}

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(
    private readonly friendService: FriendService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * T162: GET /friends - Get list of friends
   */
  @Get()
  async getFriends(@Request() req, @Query() query: GetFriendsQueryDto) {
    const userId = req.user.userId || req.user.sub;

    const result = await this.friendService.getFriends({
      user_id: userId,
      status: query.status,
      page: query.page ? parseInt(query.page as any, 10) : 1,
      limit: query.limit ? parseInt(query.limit as any, 10) : 20,
      search: query.search,
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * T163: POST /friends/requests - Send friend request
   */
  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  async sendFriendRequest(@Request() req, @Body() dto: SendFriendRequestDto) {
    const userId = req.user.userId || req.user.sub;

    const friendRequest = await this.friendService.sendFriendRequest({
      user_id: userId,
      friend_id: dto.friend_id,
      message: dto.message,
    });

    // Send real-time notification to the friend
    this.notificationsGateway.notifyFriendRequest(dto.friend_id, {
      id: userId,
      username: req.user.username || 'User',
    });

    return {
      success: true,
      data: friendRequest,
      message: 'Friend request sent successfully',
    };
  }

  /**
   * GET /friends/requests/pending - Get pending friend requests
   */
  @Get('requests/pending')
  async getPendingRequests(@Request() req) {
    const userId = req.user.userId || req.user.sub;

    const pendingRequests = await this.friendService.getPendingRequests(userId);

    return {
      success: true,
      data: {
        requests: pendingRequests,
        total: pendingRequests.length,
      },
    };
  }

  /**
   * GET /friends/requests/sent - Get sent friend requests
   */
  @Get('requests/sent')
  async getSentRequests(@Request() req) {
    const userId = req.user.userId || req.user.sub;

    const sentRequests = await this.friendService.getSentRequests(userId);

    return {
      success: true,
      data: {
        requests: sentRequests,
        total: sentRequests.length,
      },
    };
  }

  /**
   * PATCH /friends/requests/:id/accept - Accept friend request
   */
  @Patch('requests/:id/accept')
  async acceptFriendRequest(
    @Request() req,
    @Param('id', ParseIntPipe) requestId: number,
  ) {
    const userId = req.user.userId || req.user.sub;

    const acceptedRequest = await this.friendService.acceptFriendRequest(requestId, userId);

    // Send real-time notification to the friend
    this.notificationsGateway.notifyFriendAccepted(acceptedRequest.user_id, {
      id: userId,
      username: req.user.username || 'User',
    });

    return {
      success: true,
      data: acceptedRequest,
      message: 'Friend request accepted',
    };
  }

  /**
   * PATCH /friends/requests/:id/reject - Reject friend request
   */
  @Patch('requests/:id/reject')
  async rejectFriendRequest(
    @Request() req,
    @Param('id', ParseIntPipe) requestId: number,
  ) {
    const userId = req.user.userId || req.user.sub;

    const rejectedRequest = await this.friendService.rejectFriendRequest(requestId, userId);

    return {
      success: true,
      data: rejectedRequest,
      message: 'Friend request rejected',
    };
  }

  /**
   * POST /friends/:friendId/block - Block a user
   */
  @Post(':friendId/block')
  @HttpCode(HttpStatus.OK)
  async blockUser(
    @Request() req,
    @Param('friendId', ParseIntPipe) friendId: number,
  ) {
    const userId = req.user.userId || req.user.sub;

    const blockedRelationship = await this.friendService.blockUser(userId, friendId);

    return {
      success: true,
      data: blockedRelationship,
      message: 'User blocked successfully',
    };
  }

  /**
   * DELETE /friends/:friendId/block - Unblock a user
   */
  @Delete(':friendId/block')
  async unblockUser(
    @Request() req,
    @Param('friendId', ParseIntPipe) friendId: number,
  ) {
    const userId = req.user.userId || req.user.sub;

    await this.friendService.unblockUser(userId, friendId);

    return {
      success: true,
      message: 'User unblocked successfully',
    };
  }

  /**
   * DELETE /friends/:friendId - Remove a friend
   */
  @Delete(':friendId')
  async removeFriend(
    @Request() req,
    @Param('friendId', ParseIntPipe) friendId: number,
  ) {
    const userId = req.user.userId || req.user.sub;

    await this.friendService.removeFriend(userId, friendId);

    return {
      success: true,
      message: 'Friend removed successfully',
    };
  }

  /**
   * PATCH /friends/:friendId/nickname - Update friend nickname
   */
  @Patch(':friendId/nickname')
  async updateFriendNickname(
    @Request() req,
    @Param('friendId', ParseIntPipe) friendId: number,
    @Body() dto: UpdateNicknameDto,
  ) {
    const userId = req.user.userId || req.user.sub;

    const updatedFriendship = await this.friendService.updateFriendNickname(
      userId,
      friendId,
      dto.nickname,
    );

    return {
      success: true,
      data: updatedFriendship,
      message: 'Friend nickname updated',
    };
  }

  /**
   * GET /friends/:friendId/check - Check if users are friends
   */
  @Get(':friendId/check')
  async checkFriendship(
    @Request() req,
    @Param('friendId', ParseIntPipe) friendId: number,
  ) {
    const userId = req.user.userId || req.user.sub;

    const areFriends = await this.friendService.areFriends(userId, friendId);

    return {
      success: true,
      data: {
        are_friends: areFriends,
      },
    };
  }

  /**
   * GET /friends/activity - Get friend activity feed
   */
  @Get('activity')
  async getFriendActivity(@Request() req, @Query('limit') limit?: number) {
    const userId = req.user.userId || req.user.sub;

    const activity = await this.friendService.getFriendActivity(
      userId,
      limit ? parseInt(limit as any, 10) : 20,
    );

    return {
      success: true,
      data: {
        activities: activity,
        total: activity.length,
      },
    };
  }
}

