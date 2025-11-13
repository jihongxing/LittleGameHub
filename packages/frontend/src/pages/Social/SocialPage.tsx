/**
 * Social Page Component (User Story 6)
 * T166: Main page for social features including friends and leaderboards
 */

import React, { useEffect, useState } from 'react';
import { Tabs, Card, Badge, Space, Button, message, Spin } from 'antd';
import {
  UserOutlined,
  TrophyOutlined,
  TeamOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import FriendList from '@/components/business/FriendList';
import Leaderboard from '@/components/business/Leaderboard';
import FriendActivityFeed from '@/components/business/FriendActivityFeed';
import FriendRequestButton from '@/components/business/FriendRequestButton';
import {
  getFriends,
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  type Friend,
  type FriendRequest,
} from '@/services/api/social';
import {
  connectWebSocket,
  disconnectWebSocket,
  subscribeToNotifications,
  subscribeFriends,
  type NotificationPayload,
} from '@/services/websocket/client';
import { useAuthStore } from '@/store/auth';

const { TabPane } = Tabs;

const SocialPage: React.FC = () => {
  const { token, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('friends');
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [total, setTotal] = useState(0);

  // Fetch friends list
  const fetchFriends = async () => {
    setLoading(true);
    try {
      const result = await getFriends({ status: 'accepted' });
      setFriends(result.friends);
      setTotal(result.total);
    } catch (error) {
      message.error('加载好友列表失败');
      console.error('Fetch friends error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending requests
  const fetchPendingRequests = async () => {
    try {
      const result = await getPendingRequests();
      setPendingRequests(result.requests);
    } catch (error) {
      console.error('Fetch pending requests error:', error);
    }
  };

  // Handle accept friend request
  const handleAcceptRequest = async (requestId: number) => {
    try {
      await acceptFriendRequest(requestId);
      message.success('已接受好友请求');
      fetchFriends();
      fetchPendingRequests();
    } catch (error) {
      message.error('接受好友请求失败');
      console.error('Accept friend request error:', error);
    }
  };

  // Handle reject friend request
  const handleRejectRequest = async (requestId: number) => {
    try {
      await rejectFriendRequest(requestId);
      message.success('已拒绝好友请求');
      fetchPendingRequests();
    } catch (error) {
      message.error('拒绝好友请求失败');
      console.error('Reject friend request error:', error);
    }
  };

  // Handle WebSocket notification
  const handleNotification = (notification: NotificationPayload) => {
    console.log('Received notification:', notification);

    switch (notification.type) {
      case 'friend_request':
        message.info(`${notification.data.from_username} 向你发送了好友请求`);
        fetchPendingRequests();
        break;

      case 'friend_accepted':
        message.success(`${notification.data.friend_username} 接受了你的好友请求`);
        fetchFriends();
        break;

      case 'challenge_received':
        message.info(`${notification.data.challenger_username} 向你发起了游戏挑战`);
        break;

      case 'challenge_accepted':
        message.success(`${notification.data.challenged_username} 接受了你的挑战`);
        break;

      case 'leaderboard_update':
        // Handle leaderboard updates silently or show a notification
        break;

      case 'friend_activity':
        // Friend activity updates are handled by FriendActivityFeed component
        break;

      default:
        break;
    }
  };

  // Initialize
  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();

    // Connect WebSocket if token is available
    if (token) {
      connectWebSocket(token);

      // Subscribe to notifications
      const unsubscribe = subscribeToNotifications(handleNotification);

      // Subscribe to friend updates
      // (Friend IDs will be subscribed after they are loaded)

      return () => {
        unsubscribe();
        disconnectWebSocket();
      };
    }
  }, [token]);

  // Subscribe to friends after they are loaded
  useEffect(() => {
    if (friends.length > 0) {
      const friendIds = friends.map((f) => f.friend_id);
      subscribeFriends(friendIds);
    }
  }, [friends]);

  return (
    <div className="social-page min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">社交中心</h1>
              <p className="text-gray-600">与好友一起游戏，竞争排行榜</p>
            </div>
            <FriendRequestButton onRequestSent={fetchPendingRequests} />
          </Space>
        </div>

        {/* Tabs */}
        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {/* Friends Tab */}
            <TabPane
              tab={
                <Space>
                  <TeamOutlined />
                  好友列表
                  <Badge count={total} showZero={false} />
                </Space>
              }
              key="friends"
            >
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <Card
                  title={
                    <Space>
                      <NotificationOutlined />
                      待处理的好友请求
                      <Badge count={pendingRequests.length} />
                    </Space>
                  }
                  style={{ marginBottom: 24 }}
                  size="small"
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px',
                          background: '#fafafa',
                          borderRadius: '4px',
                        }}
                      >
                        <span>来自用户 {request.user_id} 的好友请求</span>
                        <Space>
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            接受
                          </Button>
                          <Button
                            size="small"
                            onClick={() => handleRejectRequest(request.id)}
                          >
                            拒绝
                          </Button>
                        </Space>
                      </div>
                    ))}
                  </Space>
                </Card>
              )}

              {/* Friends List */}
              <FriendList
                friends={friends}
                loading={loading}
                onFriendRemoved={fetchFriends}
                onFriendUpdated={fetchFriends}
                onMessageClick={(friend) => {
                  message.info(`向 ${friend.friend_username} 发送消息（功能开发中）`);
                }}
                onChallengeClick={(friend) => {
                  message.info(`向 ${friend.friend_username} 发起挑战（功能开发中）`);
                }}
              />
            </TabPane>

            {/* Leaderboard Tab */}
            <TabPane
              tab={
                <Space>
                  <TrophyOutlined />
                  排行榜
                </Space>
              }
              key="leaderboard"
            >
              <Leaderboard />
            </TabPane>

            {/* Activity Tab */}
            <TabPane
              tab={
                <Space>
                  <NotificationOutlined />
                  好友动态
                </Space>
              }
              key="activity"
            >
              <FriendActivityFeed autoRefresh refreshInterval={60000} />
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default SocialPage;

