/**
 * Achievements Page Component (User Story 8)
 * T212: Create AchievementsPage component
 */

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Tabs, Progress, Tag, Statistic, Empty, Spin, message } from 'antd';
import { TrophyOutlined, StarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import * as achievementsApi from '@/services/api/achievements';
import type { AchievementProgress, AchievementStats } from '@/services/api/achievements';
import AchievementCard from '@/components/business/AchievementCard';
import Loading from '@/components/common/Loading';

const { TabPane } = Tabs;

const AchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch achievements
  const fetchAchievements = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Get user ID from auth context
      const userId = 1; // Placeholder
      const result = await achievementsApi.getUserAchievements(userId);
      setAchievements(result.achievements);
      setStats(result.stats);
    } catch (err: any) {
      setError(err.message || '加载失败');
      message.error('加载成就失败');
      console.error('Failed to fetch achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  // Filter achievements by tab
  const filteredAchievements = achievements.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unlocked') return item.unlocked;
    if (activeTab === 'locked') return !item.unlocked;
    return item.achievement.category === activeTab;
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" data-testid="loading-spinner">
        <Loading message="加载成就中..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="achievements-page min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Card>
            <Empty description={error}>
              <button onClick={fetchAchievements} className="text-blue-600 hover:underline">
                重试
              </button>
            </Empty>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-page min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <TrophyOutlined className="text-yellow-500" />
            我的成就
          </h1>
          <p className="text-gray-600">追踪你的游戏成就和里程碑</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="总成就"
                  value={stats.total}
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="已解锁"
                  value={stats.unlocked}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="未解锁"
                  value={stats.locked}
                  prefix={<StarOutlined />}
                  valueStyle={{ color: '#999' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="获得积分"
                  value={stats.points_earned}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Completion Progress */}
        {stats && (
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium">完成进度</span>
              <Tag color="blue">{stats.completion_percentage}%</Tag>
            </div>
            <Progress
              percent={stats.completion_percentage}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              status="active"
            />
          </Card>
        )}

        {/* Achievements Tabs */}
        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab={`全部 (${achievements.length})`} key="all" />
            <TabPane
              tab={`已解锁 (${achievements.filter((a) => a.unlocked).length})`}
              key="unlocked"
            />
            <TabPane
              tab={`未解锁 (${achievements.filter((a) => !a.unlocked).length})`}
              key="locked"
            />
            <TabPane tab="游戏" key="gameplay" />
            <TabPane tab="积分" key="points" />
            <TabPane tab="社交" key="social" />
            <TabPane tab="收藏" key="collection" />
            <TabPane tab="会员" key="membership" />
            <TabPane tab="特殊" key="special" />
          </Tabs>

          {/* Achievements Grid */}
          {filteredAchievements.length === 0 ? (
            <Empty description="暂无成就" />
          ) : (
            <Row gutter={[16, 16]} className="mt-4">
              {filteredAchievements.map((item) => (
                <Col key={item.achievement.id} xs={24} sm={12} md={8} lg={6}>
                  <AchievementCard achievementProgress={item} />
                </Col>
              ))}
            </Row>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AchievementsPage;

