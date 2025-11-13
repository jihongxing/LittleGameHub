/**
 * Membership Page
 * Main page for membership subscription and management
 * T110: Create MembershipPage component
 * T112: Implement membership purchase flow with payment integration
 */

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Tabs, Alert, Modal, message } from 'antd';
import { CrownOutlined, CheckCircleOutlined } from '@ant-design/icons';
import Loading from '@/components/common/Loading';
import MembershipPlanCard from '@/components/business/MembershipPlanCard';
import {
  getMembershipPlans,
  getCurrentMembership,
  subscribeMembership,
  cancelSubscription,
  type MembershipPlan,
  type MembershipInfo,
  type SubscriptionRequest,
} from '@/services/api/membership';

const { TabPane } = Tabs;

/**
 * Membership Page Component
 */
const MembershipPage: React.FC = () => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [subscribing, setSubscribing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch membership data
   */
  const fetchMembershipData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [plansData, infoData] = await Promise.all([
        getMembershipPlans(),
        getCurrentMembership(),
      ]);

      setPlans(plansData.plans);
      setMembershipInfo(infoData);
    } catch (err: any) {
      console.error('Failed to fetch membership data:', err);
      setError(err.message || '加载会员信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembershipData();
  }, []);

  /**
   * Handle subscribe (T112)
   */
  const handleSubscribe = async (plan: MembershipPlan, paymentMethod: 'alipay' | 'wechat_pay') => {
    try {
      setSubscribing(true);

      const request: SubscriptionRequest = {
        tier: plan.tier as any,
        payment_method: paymentMethod,
        return_url: window.location.href,
      };

      const result = await subscribeMembership(request);

      // If payment required, redirect to payment page
      if (result.payment && result.payment.payment_url) {
        Modal.confirm({
          title: '确认支付',
          content: (
            <div>
              <p>订阅：{plan.name}</p>
              <p>价格：¥{plan.price}</p>
              <p>支付方式：{paymentMethod === 'alipay' ? '支付宝' : '微信支付'}</p>
            </div>
          ),
          okText: '前往支付',
          cancelText: '取消',
          onOk: () => {
            // Redirect to payment URL
            window.location.href = result.payment!.payment_url!;
          },
        });
      } else {
        message.success('订阅成功！');
        await fetchMembershipData();
      }
    } catch (err: any) {
      console.error('Failed to subscribe:', err);
      message.error(err.response?.data?.message || '订阅失败');
    } finally {
      setSubscribing(false);
    }
  };

  /**
   * Handle cancel subscription
   */
  const handleCancelSubscription = async () => {
    Modal.confirm({
      title: '确认取消订阅',
      content: '取消后将在当前周期结束后失效，确定要取消吗？',
      okText: '确认取消',
      cancelText: '保留订阅',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancelSubscription();
          message.success('订阅已取消');
          await fetchMembershipData();
        } catch (err: any) {
          message.error('取消失败');
        }
      },
    });
  };

  if (loading && !membershipInfo) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading message="加载会员信息中..." />
      </div>
    );
  }

  return (
    <div className="membership-page min-h-screen bg-gradient-to-b from-purple-50 to-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <CrownOutlined style={{ fontSize: 64, color: '#722ed1' }} />
          <h1 className="text-4xl font-bold text-gray-900 mt-4 mb-2">会员中心</h1>
          <p className="text-xl text-gray-600">
            升级会员，解锁更多特权
          </p>
        </div>

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
          />
        )}

        {/* Current Membership Status */}
        {membershipInfo?.current_membership && (
          <Card className="mb-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  {membershipInfo.tier.toUpperCase()} 会员
                </h3>
                <p className="opacity-90">
                  有效期至：{new Date(membershipInfo.current_membership.end_date).toLocaleDateString()}
                </p>
                <p className="opacity-90">
                  积分倍数：{membershipInfo.point_multiplier}x
                </p>
              </div>
              {membershipInfo.current_membership.auto_renew && (
                <Button
                  danger
                  onClick={handleCancelSubscription}
                  data-testid="cancel-subscription-button"
                >
                  取消续订
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Membership Plans */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">选择适合您的会员方案</h2>
          <Row gutter={[24, 24]}>
            {plans.map((plan) => (
              <Col key={plan.tier} xs={24} sm={12} md={8}>
                <MembershipPlanCard
                  plan={plan}
                  currentTier={membershipInfo?.tier || 'free'}
                  onSubscribe={handleSubscribe}
                  subscribing={subscribing}
                />
              </Col>
            ))}
          </Row>
        </div>

        {/* Features Comparison */}
        <Card className="mb-8">
          <h3 className="text-xl font-bold mb-4">会员特权对比</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">特权</th>
                  <th className="text-center p-3">免费用户</th>
                  <th className="text-center p-3">基础会员</th>
                  <th className="text-center p-3">高级会员</th>
                  <th className="text-center p-3">离线会员</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3">免广告</td>
                  <td className="text-center p-3">-</td>
                  <td className="text-center p-3"><CheckCircleOutlined style={{ color: '#52c41a' }} /></td>
                  <td className="text-center p-3"><CheckCircleOutlined style={{ color: '#52c41a' }} /></td>
                  <td className="text-center p-3"><CheckCircleOutlined style={{ color: '#52c41a' }} /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">积分加成</td>
                  <td className="text-center p-3">1x</td>
                  <td className="text-center p-3">1.2x</td>
                  <td className="text-center p-3">1.5x</td>
                  <td className="text-center p-3">2x</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">云存档</td>
                  <td className="text-center p-3">-</td>
                  <td className="text-center p-3">-</td>
                  <td className="text-center p-3"><CheckCircleOutlined style={{ color: '#52c41a' }} /></td>
                  <td className="text-center p-3"><CheckCircleOutlined style={{ color: '#52c41a' }} /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">离线下载</td>
                  <td className="text-center p-3">-</td>
                  <td className="text-center p-3">-</td>
                  <td className="text-center p-3">-</td>
                  <td className="text-center p-3">20GB</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Membership History */}
        {membershipInfo && membershipInfo.history.length > 0 && (
          <Card title="订阅历史">
            <div className="space-y-2">
              {membershipInfo.history.map((membership) => (
                <div
                  key={membership.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <span className="font-semibold">{membership.tier.toUpperCase()}</span>
                    <span className="text-gray-500 ml-2">
                      {new Date(membership.start_date).toLocaleDateString()} - 
                      {new Date(membership.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      membership.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {membership.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MembershipPage;

