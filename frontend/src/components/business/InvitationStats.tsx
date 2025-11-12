/**
 * Invitation Stats Component
 * Displays user's invitation statistics
 * T133: Create InvitationStats component
 */

import React, { useEffect, useState } from 'react';
import { Row, Col, Statistic, Card, Progress } from 'antd';
import {
  UserAddOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import { getRewardMilestones, type InvitationStats as IStats } from '@/services/api/invitations';

interface InvitationStatsProps {
  stats: IStats;
}

/**
 * Invitation Stats Component
 */
const InvitationStats: React.FC<InvitationStatsProps> = ({ stats }) => {
  const [totalPotential, setTotalPotential] = useState<number>(0);

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const data = await getRewardMilestones();
        setTotalPotential(data.total_potential_rewards);
      } catch (err) {
        console.error('Failed to fetch milestones:', err);
      }
    };

    fetchMilestones();
  }, []);

  return (
    <div className="invitation-stats">
      {/* Key Metrics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总邀请数"
              value={stats.total_invitations}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#1890ff' }}
              data-testid="total-invitations"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已接受"
              value={stats.accepted_invitations}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              data-testid="accepted-invitations"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待接受"
              value={stats.pending_invitations}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
              data-testid="pending-invitations"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="累计获得积分"
              value={stats.total_points_earned}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#f5222d' }}
              data-testid="total-points"
            />
          </Card>
        </Col>
      </Row>

      {/* Conversion Rate */}
      <Card title="转化率" className="mb-6">
        <div className="flex items-center gap-4">
          <Progress
            type="circle"
            percent={stats.conversion_rate}
            format={(percent) => `${percent}%`}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <div className="flex-1">
            <p className="text-gray-600 mb-2">
              {stats.accepted_invitations} / {stats.total_invitations} 位好友已接受邀请
            </p>
            <p className="text-sm text-gray-500">
              转化率越高，说明您的邀请链接越有吸引力！
            </p>
          </div>
        </div>
      </Card>

      {/* Reward Progress */}
      {totalPotential > 0 && (
        <Card title="奖励进度">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span>已获得积分</span>
                <span className="font-bold text-orange-500">
                  {stats.total_points_earned} / {totalPotential * stats.accepted_invitations}
                </span>
              </div>
              <Progress
                percent={
                  stats.accepted_invitations > 0
                    ? (stats.total_points_earned / (totalPotential * stats.accepted_invitations)) * 100
                    : 0
                }
                strokeColor="#ff6b6b"
              />
            </div>
            <p className="text-sm text-gray-500">
              每位好友最多可为您带来 {totalPotential} 积分奖励
            </p>
          </div>
        </Card>
      )}

      {/* Tips */}
      <Card title="💡 提示" className="mt-6">
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• 好友注册成功后，您将获得 50 积分</li>
          <li>• 好友首次游玩游戏，您将额外获得 100 积分</li>
          <li>• 好友首次兑换奖励，您将额外获得 150 积分</li>
          <li>• 好友购买会员，您将额外获得 500 积分</li>
          <li>• 邀请链接有效期为 30 天</li>
        </ul>
      </Card>
    </div>
  );
};

export default InvitationStats;

