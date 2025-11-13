/**
 * WebSocket Notifications Gateway (User Story 6)
 * T161: WebSocket gateway for real-time social notifications
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface NotificationPayload {
  type: 'friend_request' | 'friend_accepted' | 'challenge_received' | 'challenge_accepted' | 'leaderboard_update' | 'friend_activity';
  data: any;
  timestamp: Date;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Configure appropriately for production
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets: Map<number, string[]> = new Map(); // userId -> socketIds

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Initialize gateway
   */
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub || payload.userId;

      if (!userId) {
        this.logger.warn(`Client ${client.id} has invalid token`);
        client.disconnect();
        return;
      }

      // Store user-socket mapping
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)!.push(client.id);

      // Store userId in socket data for later reference
      client.data.userId = userId;

      // Join user-specific room
      client.join(`user:${userId}`);

      this.logger.log(`Client ${client.id} connected for user ${userId}`);

      // Send connection acknowledgment
      client.emit('connected', {
        message: 'Successfully connected to notifications',
        userId,
      });
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId && this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId)!;
      const index = sockets.indexOf(client.id);
      if (index > -1) {
        sockets.splice(index, 1);
      }

      // Remove user entry if no more sockets
      if (sockets.length === 0) {
        this.userSockets.delete(userId);
      }
    }

    this.logger.log(`Client ${client.id} disconnected`);
  }

  /**
   * Subscribe to friend updates
   */
  @SubscribeMessage('subscribe:friends')
  handleSubscribeFriends(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { friendIds: number[] },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    // Join rooms for each friend
    data.friendIds?.forEach((friendId) => {
      client.join(`friend:${friendId}`);
    });

    this.logger.log(`User ${userId} subscribed to friends: ${data.friendIds}`);

    return { success: true, message: 'Subscribed to friend updates' };
  }

  /**
   * Subscribe to game leaderboard updates
   */
  @SubscribeMessage('subscribe:leaderboard')
  handleSubscribeLeaderboard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: number },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    // Join game leaderboard room
    client.join(`leaderboard:${data.gameId}`);

    this.logger.log(`User ${userId} subscribed to leaderboard for game ${data.gameId}`);

    return { success: true, message: 'Subscribed to leaderboard updates' };
  }

  /**
   * Unsubscribe from leaderboard updates
   */
  @SubscribeMessage('unsubscribe:leaderboard')
  handleUnsubscribeLeaderboard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: number },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    // Leave game leaderboard room
    client.leave(`leaderboard:${data.gameId}`);

    this.logger.log(`User ${userId} unsubscribed from leaderboard for game ${data.gameId}`);

    return { success: true, message: 'Unsubscribed from leaderboard updates' };
  }

  /**
   * Send notification to a specific user
   */
  sendNotificationToUser(userId: number, notification: NotificationPayload) {
    const room = `user:${userId}`;
    this.server.to(room).emit('notification', notification);
    this.logger.debug(`Sent notification to user ${userId}: ${notification.type}`);
  }

  /**
   * Send notification to multiple users
   */
  sendNotificationToUsers(userIds: number[], notification: NotificationPayload) {
    userIds.forEach((userId) => {
      this.sendNotificationToUser(userId, notification);
    });
  }

  /**
   * Broadcast friend request notification
   */
  notifyFriendRequest(userId: number, from: { id: number; username: string }) {
    this.sendNotificationToUser(userId, {
      type: 'friend_request',
      data: {
        from_user_id: from.id,
        from_username: from.username,
        message: `${from.username} sent you a friend request`,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast friend request accepted notification
   */
  notifyFriendAccepted(userId: number, friend: { id: number; username: string }) {
    this.sendNotificationToUser(userId, {
      type: 'friend_accepted',
      data: {
        friend_user_id: friend.id,
        friend_username: friend.username,
        message: `${friend.username} accepted your friend request`,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast game challenge notification
   */
  notifyChallengeReceived(
    userId: number,
    challenge: {
      id: number;
      challenger_id: number;
      challenger_username: string;
      game_id: number;
      game_title: string;
      challenge_type: string;
    },
  ) {
    this.sendNotificationToUser(userId, {
      type: 'challenge_received',
      data: {
        challenge_id: challenge.id,
        challenger_id: challenge.challenger_id,
        challenger_username: challenge.challenger_username,
        game_id: challenge.game_id,
        game_title: challenge.game_title,
        challenge_type: challenge.challenge_type,
        message: `${challenge.challenger_username} challenged you to ${challenge.game_title}`,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast challenge accepted notification
   */
  notifyChallengeAccepted(
    userId: number,
    challenge: {
      id: number;
      challenged_id: number;
      challenged_username: string;
      game_title: string;
    },
  ) {
    this.sendNotificationToUser(userId, {
      type: 'challenge_accepted',
      data: {
        challenge_id: challenge.id,
        challenged_id: challenge.challenged_id,
        challenged_username: challenge.challenged_username,
        game_title: challenge.game_title,
        message: `${challenge.challenged_username} accepted your challenge`,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast leaderboard update to game room
   */
  notifyLeaderboardUpdate(
    gameId: number,
    update: {
      user_id: number;
      username: string;
      new_rank: number;
      old_rank?: number;
      score: number;
    },
  ) {
    const room = `leaderboard:${gameId}`;
    this.server.to(room).emit('leaderboard_update', {
      type: 'leaderboard_update',
      data: update,
      timestamp: new Date(),
    });
    this.logger.debug(`Broadcasted leaderboard update for game ${gameId}`);
  }

  /**
   * Broadcast friend activity
   */
  notifyFriendActivity(
    friendIds: number[],
    activity: {
      user_id: number;
      username: string;
      activity_type: string;
      game_title?: string;
      score?: number;
      achievement_name?: string;
    },
  ) {
    const notification: NotificationPayload = {
      type: 'friend_activity',
      data: activity,
      timestamp: new Date(),
    };

    this.sendNotificationToUsers(friendIds, notification);
  }

  /**
   * Get online status for users
   */
  getOnlineUsers(userIds: number[]): number[] {
    return userIds.filter((userId) => this.userSockets.has(userId));
  }

  /**
   * Check if a user is online
   */
  isUserOnline(userId: number): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get count of connected clients
   */
  getConnectedClientsCount(): number {
    return this.server.sockets.sockets.size;
  }

  /**
   * Get count of connected users
   */
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }
}

