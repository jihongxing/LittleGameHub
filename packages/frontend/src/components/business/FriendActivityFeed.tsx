/**
 * FriendActivityFeed Component (User Story 6)
 * T169: Component for displaying friend activity feed
 */

import React, { useEffect, useState } from 'react';
import { List, Avatar, Space, Tag, Empty, Spin, Alert, Button } from 'antd';
import {
  UserOutlined,
  TrophyOutlined,
  StarOutlined,
  FireOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { FriendActivity } from '@/services/api/social';
import { getFriendActivity } from '@/services/api/social';

interface FriendActivityFeedProps {
  limit?: number;
  height?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

const FriendActivityFeed: React.FC<FriendActivityFeedProps> = ({
  limit = 20,
  height = 600,
  autoRefresh = false,
  refreshInterval = 60000, // 60 seconds
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<FriendActivity[]>([]);

  // Fetch friend activity
  const fetchActivity = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getFriendActivity(limit);
      setActivities(result.activities);
    } catch (err: any) {
      setError(err.message || '加载好友动态失败');
      console.error('Fetch friend activity error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();

    // Setup auto-refresh
    if (autoRefresh) {
      const intervalId = setInterval(fetchActivity, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [autoRefresh, refreshInterval, limit]);

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'game_completed':
        return <TrophyOutlined style={{ color: '#52c41a' }} />;
      case 'achievement_unlocked':
        return <StarOutlined style={{ color: '#faad14' }} />;
      case 'challenge_won':
        return <FireOutlined style={{ color: '#f5222d' }} />;
      case 'new_high_score':
        return <TrophyOutlined style={{ color: '#1890ff' }} />;
      default:
        return <UserOutlined />;
    }
  };

  // Get activity text
  const getActivityText = (activity: FriendActivity): string => {
    switch (activity.activity_type) {
      case 'game_completed':
        return `完成了游戏 ${activity.game_title}`;
      case 'achievement_unlocked':
        return `解锁了成就 "${activity.achievement_name}"`;
      case 'challenge_won':
        return `在挑战中获胜`;
      case 'new_high_score':
        return `在 ${activity.game_title} 中创造了新纪录: ${activity.score}`;
      default:
        return '有新动态';
    }
  };

  // Get activity type tag
  const getActivityTypeTag = (type: string) => {
    const tagMap: Record<string, { text: string; color: string }> = {
      game_completed: { text: '游戏完成', color: 'green' },
      achievement_unlocked: { text: '成就解锁', color: 'gold' },
      challenge_won: { text: '挑战胜利', color: 'red' },
      new_high_score: { text: '新纪录', color: 'blue' },
    };

    const tagInfo = tagMap[type] || { text: '动态', color: 'default' };
    return <Tag color={tagInfo.color}>{tagInfo.text}</Tag>;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return activityTime.toLocaleDateString('zh-CN');
  };

  if (error) {
    return (
      <Alert
        message="加载失败"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={fetchActivity}>
            重试
          </Button>
        }
      />
    );
  }

  return (
    <div className="friend-activity-feed">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>好友动态</h3>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchActivity}
          loading={loading}
          size="small"
        >
          刷新
        </Button>
      </div>

      <Spin spinning={loading}>
        <List
          dataSource={activities}
          renderItem={(activity) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    size={48}
                    src={activity.friend_avatar}
                    icon={<UserOutlined />}
                  />
                }
                title={
                  <Space>
                    <span style={{ fontWeight: 500 }}>{activity.friend_username}</span>
                    {getActivityTypeTag(activity.activity_type)}
                  </Space>
                }
                description={
                  <div>
                    <Space style={{ marginBottom: 4 }}>
                      {getActivityIcon(activity.activity_type)}
                      <span>{getActivityText(activity)}</span>
                    </Space>
                    <div style={{ fontSize: '0.85em', color: '#888' }}>
                      {formatTimestamp(activity.timestamp)}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
          style={{
            maxHeight: height,
            overflowY: 'auto',
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无好友动态"
              >
                <p style={{ color: '#999', fontSize: '0.9em' }}>
                  你的好友还没有游戏活动
                </p>
              </Empty>
            ),
          }}
        />
      </Spin>
    </div>
  );
};

export default FriendActivityFeed;

