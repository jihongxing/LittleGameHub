/**
 * Invitation Leaderboard Component
 * Displays top inviters leaderboard
 * T135: Implement invitation leaderboard display
 */

import React, { useState, useEffect } from 'react';
import { List, Avatar, Tag, Empty, Spin } from 'antd';
import { TrophyOutlined, CrownOutlined } from '@ant-design/icons';
import { getInvitationLeaderboard, type LeaderboardEntry } from '@/services/api/invitations';

/**
 * Invitation Leaderboard Component
 */
const InvitationLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await getInvitationLeaderboard(10);
      setLeaderboard(data.leaderboard);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get rank medal
   */
  const getRankMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  /**
   * Get rank color
   */
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'default';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Empty
        description="暂无排行榜数据"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div className="invitation-leaderboard" data-testid="leaderboard">
      {/* Header */}
      <div className="mb-6 text-center">
        <CrownOutlined style={{ fontSize: 48, color: '#faad14' }} />
        <h3 className="text-xl font-bold mt-2">邀请达人榜</h3>
        <p className="text-gray-600">看看谁是最强邀请王！</p>
      </div>

      {/* Leaderboard List */}
      <List
        dataSource={leaderboard}
        renderItem={(entry) => {
          const medal = getRankMedal(entry.rank);
          const isTopThree = entry.rank <= 3;

          return (
            <List.Item
              className={`${
                isTopThree ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
              } rounded-lg mb-2 px-4`}
              data-testid={`leaderboard-rank-${entry.rank}`}
            >
              <div className="flex items-center gap-4 w-full">
                {/* Rank */}
                <div className="w-12 text-center">
                  {medal ? (
                    <span className="text-3xl">{medal}</span>
                  ) : (
                    <Tag color={getRankColor(entry.rank)} className="text-lg">
                      #{entry.rank}
                    </Tag>
                  )}
                </div>

                {/* Avatar */}
                <Avatar
                  size={isTopThree ? 56 : 48}
                  style={{
                    backgroundColor: isTopThree ? '#faad14' : '#1890ff',
                  }}
                >
                  {entry.user_id.substring(0, 2).toUpperCase()}
                </Avatar>

                {/* Info */}
                <div className="flex-1">
                  <div className="font-semibold text-base">
                    用户 {entry.user_id.substring(0, 8)}
                  </div>
                  <div className="text-sm text-gray-600">
                    邀请 {entry.total_invitations} 位好友
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className="flex items-center gap-1 text-orange-500 font-bold text-lg">
                    <TrophyOutlined />
                    <span data-testid={`points-${entry.rank}`}>
                      {entry.total_points}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">总积分</div>
                </div>
              </div>
            </List.Item>
          );
        }}
      />

      {/* Footer Tip */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>💡 多邀请好友，争取上榜！</p>
      </div>
    </div>
  );
};

export default InvitationLeaderboard;

