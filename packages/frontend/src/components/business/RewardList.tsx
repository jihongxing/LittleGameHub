/**
 * Reward List Component
 * Displays available rewards for redemption
 * T086: Create RewardList component
 * T091: Implement reward redemption flow with confirmation
 */

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Tag, Modal, message, Alert, Descriptions } from 'antd';
import { GiftOutlined, TrophyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getRewards, redeemReward, type Reward } from '@/services/api/rewards';

interface RewardListProps {
  currentBalance: number;
  onRedeemSuccess?: () => void;
}

/**
 * Reward List Component
 */
const RewardList: React.FC<RewardListProps> = ({ currentBalance, onRedeemSuccess }) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [redeemingReward, setRedeemingReward] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    reward: Reward | null;
  }>({ visible: false, reward: null });

  /**
   * Fetch rewards
   */
  const fetchRewards = async () => {
    try {
      setLoading(true);
      const data = await getRewards();
      setRewards(data?.rewards || []);
    } catch (err: any) {
      console.error('Failed to fetch rewards:', err);
      message.error('加载奖励失败');
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  /**
   * Handle redeem button click (T091)
   */
  const handleRedeemClick = (reward: Reward) => {
    // Check insufficient points
    if (currentBalance < reward.point_cost) {
      Modal.warning({
        title: '积分不足',
        content: (
          <div data-testid="insufficient-points-warning">
            <p>兑换此奖励需要 {reward.point_cost} 积分</p>
            <p>您当前积分：{currentBalance}</p>
            <p>还需要：{reward.point_cost - currentBalance} 积分</p>
          </div>
        ),
      });
      return;
    }

    // Show confirmation dialog
    setConfirmModal({ visible: true, reward });
  };

  /**
   * Confirm redemption (T091)
   */
  const handleConfirmRedeem = async () => {
    const reward = confirmModal.reward;
    if (!reward) return;

    try {
      setRedeemingReward(reward.id);
      const result = await redeemReward(reward.id, true);

      // Close confirmation modal
      setConfirmModal({ visible: false, reward: null });

      // Show success modal with confirmation code
      Modal.success({
        title: '兑换成功',
        content: (
          <div data-testid="redemption-success">
            <p>您已成功兑换：<strong>{reward.name}</strong></p>
            <p>消耗积分：{result.points_spent}</p>
            <p>剩余积分：{result.new_balance}</p>
            <Alert
              message={
                <div>
                  确认码：<strong data-testid="confirmation-code">{result.confirmation_code}</strong>
                </div>
              }
              type="info"
              showIcon
              icon={<CheckCircleOutlined />}
              className="mt-2"
            />
            <p className="mt-2 text-sm text-gray-600">
              请保存好您的确认码，兑换状态：{getDeliveryStatusText(result.delivery_status)}
            </p>
          </div>
        ),
        width: 500,
      });

      // Refresh rewards
      await fetchRewards();

      // Notify parent
      if (onRedeemSuccess) {
        onRedeemSuccess();
      }
    } catch (err: any) {
      console.error('Failed to redeem reward:', err);
      message.error(err.response?.data?.message || '兑换失败');
    } finally {
      setRedeemingReward(null);
    }
  };

  /**
   * Get delivery status text
   */
  const getDeliveryStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      delivered: '已发放',
      failed: '失败',
    };
    return statusMap[status] || status;
  };

  /**
   * Get reward type tag
   */
  const getRewardTypeTag = (type: string) => {
    const typeConfig: Record<string, { color: string; text: string }> = {
      membership_trial: { color: 'purple', text: '会员试用' },
      cash: { color: 'green', text: '现金奖励' },
      virtual_item: { color: 'blue', text: '虚拟物品' },
      coupon: { color: 'orange', text: '优惠券' },
    };
    const config = typeConfig[type] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  /**
   * Check if reward is affordable
   */
  const isAffordable = (reward: Reward): boolean => {
    return currentBalance >= reward.point_cost;
  };

  return (
    <div className="reward-list">
      {/* Info Banner */}
      <Alert
        message="积分兑换说明"
        description="选择心仪的奖励，使用积分即可兑换。兑换后将生成确认码，请妥善保管。"
        type="info"
        showIcon
        className="mb-4"
      />

      {/* Reward Grid */}
      <Row gutter={[16, 16]}>
        {rewards.map((reward) => {
          const affordable = isAffordable(reward);
          const outOfStock = reward.availability_status === 'out_of_stock';

          return (
            <Col key={reward.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable={affordable && !outOfStock}
                className={`h-full ${!affordable ? 'opacity-60' : ''}`}
                data-testid="reward-card"
                cover={
                  <div className="relative h-40 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <GiftOutlined style={{ fontSize: 64, color: 'white' }} />
                    {reward.is_featured && (
                      <Tag color="gold" className="absolute top-2 right-2">
                        推荐
                      </Tag>
                    )}
                  </div>
                }
              >
                <div className="space-y-2">
                  {/* Name */}
                  <h3 className="text-lg font-semibold mb-1" data-testid="reward-name">
                    {reward.name}
                  </h3>

                  {/* Type */}
                  {getRewardTypeTag(reward.reward_type)}

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {reward.description}
                  </p>

                  {/* Cost */}
                  <div className="flex items-center justify-between py-2 border-t">
                    <div className="flex items-center gap-1" data-testid="reward-cost">
                      <TrophyOutlined className="text-orange-500" />
                      <span className="text-lg font-bold text-orange-500">
                        {reward.point_cost}
                      </span>
                      <span className="text-sm text-gray-500">积分</span>
                    </div>
                  </div>

                  {/* Stock */}
                  {reward.stock_quantity !== null && (
                    <div className="text-xs text-gray-500">
                      剩余：{reward.stock_quantity} 个
                    </div>
                  )}

                  {/* Redeem Button */}
                  <Button
                    type={affordable ? 'primary' : 'default'}
                    block
                    disabled={!affordable || outOfStock || redeemingReward === reward.id}
                    loading={redeemingReward === reward.id}
                    onClick={() => handleRedeemClick(reward)}
                    data-testid="redeem-button"
                  >
                    {outOfStock ? '已售罄' : affordable ? '立即兑换' : '积分不足'}
                  </Button>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Empty State */}
      {!loading && rewards.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <GiftOutlined style={{ fontSize: 64, marginBottom: 16 }} />
          <p>暂无可兑换的奖励</p>
        </div>
      )}

      {/* Confirmation Modal (T091) */}
      <Modal
        title="确认兑换"
        open={confirmModal.visible}
        onOk={handleConfirmRedeem}
        onCancel={() => setConfirmModal({ visible: false, reward: null })}
        okText="确认兑换"
        cancelText="取消"
        confirmLoading={redeemingReward !== null}
        data-testid="confirm-redemption-dialog"
      >
        {confirmModal.reward && (
          <div>
            <p className="mb-4">确定要兑换以下奖励吗？</p>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="奖励名称">
                {confirmModal.reward.name}
              </Descriptions.Item>
              <Descriptions.Item label="奖励类型">
                {getRewardTypeTag(confirmModal.reward.reward_type)}
              </Descriptions.Item>
              <Descriptions.Item label="所需积分">
                <span className="text-orange-500 font-bold">
                  {confirmModal.reward.point_cost}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="当前积分">
                {currentBalance}
              </Descriptions.Item>
              <Descriptions.Item label="兑换后积分">
                {currentBalance - confirmModal.reward.point_cost}
              </Descriptions.Item>
            </Descriptions>
            <Alert
              message="温馨提示"
              description="兑换后将生成确认码，请妥善保管。部分奖励可能需要人工审核发放。"
              type="warning"
              showIcon
              className="mt-4"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RewardList;
