/**
 * WebSocket Client for Real-time Updates (User Story 6)
 * T170: WebSocket client for real-time social notifications
 */

import { io, Socket } from 'socket.io-client';

export interface NotificationPayload {
  type: 'friend_request' | 'friend_accepted' | 'challenge_received' | 'challenge_accepted' | 'leaderboard_update' | 'friend_activity';
  data: any;
  timestamp: Date;
}

export type NotificationHandler = (notification: NotificationPayload) => void;

class WebSocketClient {
  private socket: Socket | null = null;
  private notificationHandlers: Set<NotificationHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // 2 seconds

  /**
   * Connect to WebSocket server
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

    this.socket = io(`${wsUrl}/notifications`, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
      console.log('WebSocket disconnected');
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('connected', (data) => {
      console.log('WebSocket connection acknowledged:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    // Notification events
    this.socket.on('notification', (notification: NotificationPayload) => {
      console.log('Received notification:', notification);
      this.handleNotification(notification);
    });

    this.socket.on('leaderboard_update', (update) => {
      console.log('Leaderboard update:', update);
      this.handleNotification(update);
    });
  }

  /**
   * Handle incoming notifications
   */
  private handleNotification(notification: NotificationPayload): void {
    this.notificationHandlers.forEach((handler) => {
      try {
        handler(notification);
      } catch (error) {
        console.error('Error in notification handler:', error);
      }
    });
  }

  /**
   * Subscribe to notifications
   */
  onNotification(handler: NotificationHandler): () => void {
    this.notificationHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.notificationHandlers.delete(handler);
    };
  }

  /**
   * Subscribe to friend updates
   */
  subscribeFriends(friendIds: number[]): void {
    if (!this.socket?.connected) {
      console.warn('Cannot subscribe to friends: WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe:friends', { friendIds }, (response: any) => {
      console.log('Subscribed to friends:', response);
    });
  }

  /**
   * Subscribe to leaderboard updates for a specific game
   */
  subscribeLeaderboard(gameId: number): void {
    if (!this.socket?.connected) {
      console.warn('Cannot subscribe to leaderboard: WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe:leaderboard', { gameId }, (response: any) => {
      console.log('Subscribed to leaderboard:', response);
    });
  }

  /**
   * Unsubscribe from leaderboard updates
   */
  unsubscribeLeaderboard(gameId: number): void {
    if (!this.socket?.connected) {
      console.warn('Cannot unsubscribe from leaderboard: WebSocket not connected');
      return;
    }

    this.socket.emit('unsubscribe:leaderboard', { gameId }, (response: any) => {
      console.log('Unsubscribed from leaderboard:', response);
    });
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();

// Convenience functions
export function connectWebSocket(token: string): void {
  wsClient.connect(token);
}

export function disconnectWebSocket(): void {
  wsClient.disconnect();
}

export function subscribeToNotifications(handler: NotificationHandler): () => void {
  return wsClient.onNotification(handler);
}

export function subscribeFriends(friendIds: number[]): void {
  wsClient.subscribeFriends(friendIds);
}

export function subscribeLeaderboard(gameId: number): void {
  wsClient.subscribeLeaderboard(gameId);
}

export function unsubscribeLeaderboard(gameId: number): void {
  wsClient.unsubscribeLeaderboard(gameId);
}

export default wsClient;

