/**
 * Friend Service (User Story 6)
 * T158: Service for managing friend requests and relationships
 */

import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FriendRelationship, FriendshipStatus } from '../entities/friend-relationship.entity';

export interface SendFriendRequestDto {
  user_id: number;
  friend_id: number;
  message?: string;
}

export interface GetFriendsQuery {
  user_id: number;
  status?: FriendshipStatus;
  page?: number;
  limit?: number;
  search?: string;
}

export interface UpdateFriendRequestDto {
  status: FriendshipStatus;
  nickname?: string;
}

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(FriendRelationship)
    private readonly friendRepository: Repository<FriendRelationship>,
  ) {}

  /**
   * Send a friend request
   */
  async sendFriendRequest(dto: SendFriendRequestDto): Promise<FriendRelationship> {
    const { user_id, friend_id, message } = dto;

    // Validate that user is not trying to add themselves
    if (user_id === friend_id) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if friendship already exists (in either direction)
    const existingFriendship = await this.friendRepository.findOne({
      where: [
        { user_id, friend_id },
        { user_id: friend_id, friend_id: user_id },
      ],
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        throw new ConflictException('You are already friends with this user');
      }
      if (existingFriendship.status === 'pending') {
        throw new ConflictException('Friend request already pending');
      }
      if (existingFriendship.status === 'blocked') {
        throw new ConflictException('Cannot send friend request to blocked user');
      }
    }

    // Create new friend request
    const friendRequest = this.friendRepository.create({
      user_id,
      friend_id,
      status: 'pending',
      notes: message,
    });

    return await this.friendRepository.save(friendRequest);
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(requestId: number, userId: number): Promise<FriendRelationship> {
    const friendRequest = await this.friendRepository.findOne({
      where: { id: requestId },
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    // Verify that the current user is the recipient of the request
    if (friendRequest.friend_id !== userId) {
      throw new BadRequestException('You are not authorized to accept this friend request');
    }

    if (friendRequest.status !== 'pending') {
      throw new BadRequestException('Friend request is not in pending state');
    }

    // Update the status to accepted
    friendRequest.status = 'accepted';
    friendRequest.accepted_at = new Date();
    friendRequest.last_interaction_at = new Date();

    return await this.friendRepository.save(friendRequest);
  }

  /**
   * Reject a friend request
   */
  async rejectFriendRequest(requestId: number, userId: number): Promise<FriendRelationship> {
    const friendRequest = await this.friendRepository.findOne({
      where: { id: requestId },
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    // Verify that the current user is the recipient of the request
    if (friendRequest.friend_id !== userId) {
      throw new BadRequestException('You are not authorized to reject this friend request');
    }

    if (friendRequest.status !== 'pending') {
      throw new BadRequestException('Friend request is not in pending state');
    }

    // Update the status to rejected
    friendRequest.status = 'rejected';

    return await this.friendRepository.save(friendRequest);
  }

  /**
   * Block a user
   */
  async blockUser(userId: number, friendId: number): Promise<FriendRelationship> {
    // Find existing relationship
    let relationship = await this.friendRepository.findOne({
      where: [
        { user_id: userId, friend_id: friendId },
        { user_id: friendId, friend_id: userId },
      ],
    });

    if (relationship) {
      // Update existing relationship to blocked
      relationship.status = 'blocked';
      relationship.user_id = userId; // Ensure the blocker is the user
      relationship.friend_id = friendId;
    } else {
      // Create new blocked relationship
      relationship = this.friendRepository.create({
        user_id: userId,
        friend_id: friendId,
        status: 'blocked',
      });
    }

    return await this.friendRepository.save(relationship);
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: number, friendId: number): Promise<void> {
    const relationship = await this.friendRepository.findOne({
      where: { user_id: userId, friend_id: friendId, status: 'blocked' },
    });

    if (!relationship) {
      throw new NotFoundException('Blocked relationship not found');
    }

    // Remove the blocked relationship
    await this.friendRepository.remove(relationship);
  }

  /**
   * Remove a friend
   */
  async removeFriend(userId: number, friendId: number): Promise<void> {
    const friendship = await this.friendRepository.findOne({
      where: [
        { user_id: userId, friend_id: friendId, status: 'accepted' },
        { user_id: friendId, friend_id: userId, status: 'accepted' },
      ],
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    await this.friendRepository.remove(friendship);
  }

  /**
   * Get all friends for a user
   */
  async getFriends(query: GetFriendsQuery): Promise<{
    friends: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { user_id, status = 'accepted', page = 1, limit = 20, search } = query;

    const queryBuilder = this.friendRepository
      .createQueryBuilder('fr')
      .where('(fr.user_id = :user_id OR fr.friend_id = :user_id)', { user_id });

    if (status) {
      queryBuilder.andWhere('fr.status = :status', { status });
    }

    // Join with users table to get friend details
    queryBuilder
      .leftJoinAndSelect('users', 'u', 'u.id = CASE WHEN fr.user_id = :user_id THEN fr.friend_id ELSE fr.user_id END')
      .select([
        'fr.id as id',
        'fr.user_id as user_id',
        'fr.friend_id as friend_id',
        'fr.status as status',
        'fr.nickname as nickname',
        'fr.accepted_at as accepted_at',
        'fr.last_interaction_at as last_interaction_at',
        'fr.created_at as created_at',
        'u.id as friend_user_id',
        'u.username as friend_username',
        'u.email as friend_email',
        'u.avatar as friend_avatar',
      ]);

    // Apply search filter if provided
    if (search) {
      queryBuilder.andWhere('(u.username ILIKE :search OR u.email ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    // Order by last interaction or creation date
    queryBuilder.orderBy('fr.last_interaction_at', 'DESC').addOrderBy('fr.created_at', 'DESC');

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [friends, total] = await Promise.all([
      queryBuilder.getRawMany(),
      queryBuilder.getCount(),
    ]);

    return {
      friends,
      total,
      page,
      limit,
    };
  }

  /**
   * Get pending friend requests for a user
   */
  async getPendingRequests(userId: number): Promise<FriendRelationship[]> {
    return await this.friendRepository.find({
      where: { friend_id: userId, status: 'pending' },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get sent friend requests by a user
   */
  async getSentRequests(userId: number): Promise<FriendRelationship[]> {
    return await this.friendRepository.find({
      where: { user_id: userId, status: 'pending' },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Check if two users are friends
   */
  async areFriends(userId: number, friendId: number): Promise<boolean> {
    const friendship = await this.friendRepository.findOne({
      where: [
        { user_id: userId, friend_id: friendId, status: 'accepted' },
        { user_id: friendId, friend_id: userId, status: 'accepted' },
      ],
    });

    return !!friendship;
  }

  /**
   * Get friend IDs for a user
   */
  async getFriendIds(userId: number): Promise<number[]> {
    const friendships = await this.friendRepository.find({
      where: [
        { user_id: userId, status: 'accepted' },
        { friend_id: userId, status: 'accepted' },
      ],
      select: ['user_id', 'friend_id'],
    });

    return friendships.map((f) => (f.user_id === userId ? f.friend_id : f.user_id));
  }

  /**
   * Update friend nickname
   */
  async updateFriendNickname(
    userId: number,
    friendId: number,
    nickname: string,
  ): Promise<FriendRelationship> {
    const friendship = await this.friendRepository.findOne({
      where: [
        { user_id: userId, friend_id: friendId, status: 'accepted' },
        { user_id: friendId, friend_id: userId, status: 'accepted' },
      ],
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    // Only allow the user to set nickname for their own relationship record
    if (friendship.user_id !== userId) {
      throw new BadRequestException('Cannot update nickname for this friendship');
    }

    friendship.nickname = nickname;
    friendship.last_interaction_at = new Date();

    return await this.friendRepository.save(friendship);
  }

  /**
   * Get friend activity (recent game sessions, achievements, etc.)
   */
  async getFriendActivity(userId: number, limit = 20): Promise<any[]> {
    // Get friend IDs
    const friendIds = await this.getFriendIds(userId);

    if (friendIds.length === 0) {
      return [];
    }

    // TODO: Query game sessions, achievements, and other activities
    // This is a placeholder implementation
    // In a real implementation, you would join with game_sessions, achievements, etc.

    return [];
  }
}

