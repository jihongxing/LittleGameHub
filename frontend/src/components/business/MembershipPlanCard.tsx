/**
 * Membership Plan Card Component
 * Displays a membership plan with subscribe button
 * T111: Create MembershipPlanCard component
 */

import React, { useState } from 'react';
import { Card, Button, Tag, Space, Modal, Radio } from 'antd';
import { CrownOutlined, CheckOutlined, StarFilled } from '@ant-design/icons';
import type { MembershipPlan } from '@/services/api/membership';

interface MembershipPlanCardProps {
  plan: MembershipPlan;
  currentTier: string;
  onSubscribe: (plan: MembershipPlan, paymentMethod: 'alipay' | 'wechat_pay') => void;
  subscribing?: boolean;
}

/**
 * Membership Plan Card Component
 */
const MembershipPlanCard: React.FC<MembershipPlanCardProps> = ({
  plan,
  currentTier,
  onSubscribe,
  subscribing = false,
}) => {
  const [paymentModalVisible, setPaymentModalVisible] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'alipay' | 'wechat_pay'>('alipay');

  const isCurrentPlan = plan.tier === currentTier;
  const isFree = plan.tier === 'free';
  const isRecommended = plan.tier === 'premium';

  /**
   * Handle subscribe button click
   */
  const handleSubscribeClick = () => {
    if (isFree || isCurrentPlan) return;
    setPaymentModalVisible(true);
  };

  /**
   * Handle payment method confirmation
   */
  const handleConfirmPayment = () => {
    setPaymentModalVisible(false);
    onSubscribe(plan, selectedPaymentMethod);
  };

  /**
   * Get tier color
   */
  const getTierColor = () => {
    switch (plan.tier) {
      case 'basic':
        return 'blue';
      case 'premium':
        return 'purple';
      case 'offline':
        return 'gold';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Card
        className={`membership-plan-card h-full ${
          isRecommended ? 'border-2 border-purple-500' : ''
        }`}
        hoverable={!isFree && !isCurrentPlan}
        data-testid={`plan-card-${plan.tier}`}
      >
        {/* Recommended Badge */}
        {isRecommended && (
          <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 rounded-bl-lg">
            <StarFilled /> 推荐
          </div>
        )}

        {/* Plan Header */}
        <div className="text-center mb-4">
          <CrownOutlined
            style={{
              fontSize: 48,
              color: isRecommended ? '#722ed1' : '#1890ff',
              marginBottom: 8,
            }}
          />
          <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
          <Tag color={getTierColor()} className="mb-2">
            {plan.tier.toUpperCase()}
          </Tag>
          <p className="text-gray-600 text-sm">{plan.description}</p>
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          {isFree ? (
            <div>
              <span className="text-4xl font-bold">免费</span>
            </div>
          ) : (
            <div>
              <span className="text-gray-500">¥</span>
              <span className="text-4xl font-bold" data-testid="plan-price">
                {plan.price}
              </span>
              <span className="text-gray-500">/{plan.duration_months}月</span>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mb-6">
          <Space direction="vertical" className="w-full">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckOutlined style={{ color: '#52c41a' }} />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </Space>
        </div>

        {/* Subscribe Button */}
        <Button
          type={isRecommended ? 'primary' : 'default'}
          size="large"
          block
          disabled={isFree || isCurrentPlan || subscribing}
          onClick={handleSubscribeClick}
          data-testid="subscribe-button"
        >
          {isCurrentPlan ? '当前方案' : isFree ? '免费使用' : '立即订阅'}
        </Button>
      </Card>

      {/* Payment Method Modal */}
      <Modal
        title="选择支付方式"
        open={paymentModalVisible}
        onOk={handleConfirmPayment}
        onCancel={() => setPaymentModalVisible(false)}
        okText="确认支付"
        cancelText="取消"
        data-testid="payment-method-modal"
      >
        <div className="mb-4">
          <p className="mb-2">订阅：<strong>{plan.name}</strong></p>
          <p className="mb-4">
            支付金额：<span className="text-2xl font-bold text-orange-500">¥{plan.price}</span>
          </p>
        </div>

        <Radio.Group
          value={selectedPaymentMethod}
          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
          className="w-full"
        >
          <Space direction="vertical" className="w-full">
            <Radio value="alipay" className="w-full p-3 border rounded hover:border-blue-400">
              <div className="flex items-center gap-2">
                <span className="text-lg">💳</span>
                <span>支付宝</span>
              </div>
            </Radio>
            <Radio value="wechat_pay" className="w-full p-3 border rounded hover:border-green-400">
              <div className="flex items-center gap-2">
                <span className="text-lg">💚</span>
                <span>微信支付</span>
              </div>
            </Radio>
          </Space>
        </Radio.Group>
      </Modal>
    </>
  );
};

export default MembershipPlanCard;

