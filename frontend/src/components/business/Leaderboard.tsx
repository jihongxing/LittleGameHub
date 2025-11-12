/**
 * Leaderboard Component (User Story 6)
 * T168: Component for displaying game leaderboards
 */

import React, { useEffect, useState } from 'react';
import { Table, Avatar, Space, Select, Radio, Spin, Alert, Tag, Empty } from 'antd';
import { TrophyOutlined, UserOutlined, CrownOutlined, FireOutlined } from '@ant-design/icons';
import type { LeaderboardEntry } from '@/services/api/social';
import { getLeaderboard } from '@/services/api/social';
import type { RadioChangeEvent } from 'antd';

const { Option } = Select;

interface LeaderboardProps {
  gameId?: number;
  defaultScope?: 'global' | 'friends';
  defaultTimeRange?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  height?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  gameId,
  defaultScope = 'global',
  defaultTimeRange = 'all_time',
  height = 600,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | undefined>();
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  
  const [scope, setScope] = useState<'global' | 'friends'>(defaultScope);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>(
    defaultTimeRange,
  );

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getLeaderboard({
        game_id: gameId,
        scope,
        time_range: timeRange,
        page,
        limit,
      });

      setLeaderboard(result.leaderboard);
      setCurrentUserRank(result.current_user_rank);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message || '加载排行榜失败');
      console.error('Fetch leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [gameId, scope, timeRange, page]);

  // Handle scope change
  const handleScopeChange = (e: RadioChangeEvent) => {
    setScope(e.target.value);
    setPage(1);
  };

  // Handle time range change
  const handleTimeRangeChange = (value: 'daily' | 'weekly' | 'monthly' | 'all_time') => {
    setTimeRange(value);
    setPage(1);
  };

  // Get rank badge
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <CrownOutlined style={{ color: '#FFD700', fontSize: '20px' }} />;
    }
    if (rank === 2) {
      return <CrownOutlined style={{ color: '#C0C0C0', fontSize: '18px' }} />;
    }
    if (rank === 3) {
      return <CrownOutlined style={{ color: '#CD7F32', fontSize: '16px' }} />;
    }
    return <span style={{ fontSize: '14px', color: '#888' }}>#{rank}</span>;
  };

  // Table columns
  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => (
        <div style={{ textAlign: 'center' }}>{getRankBadge(rank)}</div>
      ),
    },
    {
      title: '玩家',
      dataIndex: 'username',
      key: 'username',
      render: (_: any, record: LeaderboardEntry) => (
        <Space>
          <Avatar
            size={40}
            src={record.avatar}
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{record.username || `玩家 ${record.user_id}`}</div>
            {record.games_played && (
              <div style={{ fontSize: '0.85em', color: '#888' }}>
                {record.games_played} 场游戏
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (score: number) => (
        <Space>
          <FireOutlined style={{ color: '#ff4d4f' }} />
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {score.toLocaleString()}
          </span>
        </Space>
      ),
    },
    {
      title: '最后游玩',
      dataIndex: 'last_played_at',
      key: 'last_played_at',
      width: 180,
      render: (date: string) => (
        date ? new Date(date).toLocaleString('zh-CN') : '-'
      ),
    },
  ];

  if (error) {
    return (
      <Alert
        message="加载失败"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="leaderboard">
      {/* Filters */}
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Radio.Group value={scope} onChange={handleScopeChange}>
          <Radio.Button value="global">
            <TrophyOutlined /> 全球排行
          </Radio.Button>
          <Radio.Button value="friends">
            <UserOutlined /> 好友排行
          </Radio.Button>
        </Radio.Group>

        <Select
          value={timeRange}
          onChange={handleTimeRangeChange}
          style={{ width: 140 }}
        >
          <Option value="daily">今日</Option>
          <Option value="weekly">本周</Option>
          <Option value="monthly">本月</Option>
          <Option value="all_time">全部时间</Option>
        </Select>
      </Space>

      {/* Current User Rank */}
      {currentUserRank && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px',
            background: '#f0f2f5',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <Space>
            <span>你的排名：</span>
            <Tag color="blue" style={{ fontSize: '16px', padding: '4px 12px' }}>
              #{currentUserRank}
            </Tag>
          </Space>
        </div>
      )}

      {/* Leaderboard Table */}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={leaderboard}
          rowKey="user_id"
          pagination={{
            current: page,
            pageSize: limit,
            total: total,
            onChange: setPage,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 名玩家`,
          }}
          scroll={{ y: height - 200 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无排行数据"
              />
            ),
          }}
        />
      </Spin>
    </div>
  );
};

export default Leaderboard;

