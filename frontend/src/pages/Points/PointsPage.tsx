/**
 * Points Page
 * Main page for points, tasks, and rewards
 * T084: Create PointsPage component
 */

import React, { useState, useEffect } from 'react';
import { Tabs, Card, Statistic, Row, Col, Alert, Space } from 'antd';
import { TrophyOutlined, GiftOutlined, HistoryOutlined, ClockCircleOutlined } from '@ant-design/icons';
import Loading from '@/components/common/Loading';
import PointTaskList from '@/components/business/PointTaskList';
import RewardList from '@/components/business/RewardList';
import PointTransactionHistory from '@/components/business/PointTransactionHistory';
import { getPointBalance, type PointBalance } from '@/services/api/points';

const { TabPane } = Tabs;

/**
 * Points Page Component
 */
const PointsPage: React.FC = () => {
  const [balance, setBalance] = useState<PointBalance | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('tasks');

  /**
   * Fetch point balance
   */
  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPointBalance();
      setBalance(data);
    } catch (err: any) {
      console.error('Failed to fetch balance:', err);
      setError(err.message || '加载积分余额失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  /**
   * Handle balance update
   */
  const handleBalanceUpdate = () => {
    fetchBalance();
  };

  if (loading && !balance) {
    return (
      <div className="flex justify-center items-center min-h-screen" data-testid="loading-spinner">
        <Loading message="加载积分信息中..." />
      </div>
    );
  }

  return (
    <div className="points-page min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">积分中心</h1>
          <p className="text-gray-600">完成任务赚取积分，兑换精彩奖励</p>
        </div>

        {/* Balance Cards */}
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="当前积分"
                value={balance?.balance || 0}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#3f8600' }}
                data-testid="point-balance"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="待入账积分"
                value={balance?.pending || 0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
                data-testid="pending-points"
              />
            </Card>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <div className="text-sm opacity-90 mb-1">立即行动</div>
              <div className="text-xl font-bold">完成任务赚积分</div>
            </Card>
          </Col>
        </Row>

        {/* Error Alert */}
        {error && (
          <Alert
            message="加载失败"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            className="mb-6"
            data-testid="error-message"
          />
        )}

        {/* Tabs */}
        <Card className="shadow-sm">
          <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
            <TabPane
              tab={
                <span data-testid="tasks-tab">
                  <TrophyOutlined />
                  赚取积分
                </span>
              }
              key="tasks"
            >
              <PointTaskList onTaskComplete={handleBalanceUpdate} />
            </TabPane>

            <TabPane
              tab={
                <span data-testid="rewards-tab">
                  <GiftOutlined />
                  兑换奖励
                </span>
              }
              key="rewards"
            >
              <RewardList
                currentBalance={balance?.balance || 0}
                onRedeemSuccess={handleBalanceUpdate}
              />
            </TabPane>

            <TabPane
              tab={
                <span data-testid="transaction-history-tab">
                  <HistoryOutlined />
                  积分明细
                </span>
              }
              key="history"
            >
              <PointTransactionHistory />
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default PointsPage;
