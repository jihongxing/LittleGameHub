/**
 * Invitation Reward Notification Component
 * Displays notification when user receives invitation rewards
 * T136: Implement invitation reward notifications
 */

import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import { GiftOutlined, TrophyOutlined } from '@ant-design/icons';

export interface InvitationReward {
  type: 'registration' | 'first_game' | 'first_redemption' | 'membership_purchase';
  points: number;
  invitee_name?: string;
  timestamp: Date;
}

interface InvitationRewardNotificationProps {
  rewards: InvitationReward[];
  onRewardShown?: (reward: InvitationReward) => void;
}

/**
 * Invitation Reward Notification Component
 */
const InvitationRewardNotification: React.FC<InvitationRewardNotificationProps> = ({
  rewards,
  onRewardShown,
}) => {
  const [shownRewards, setShownRewards] = useState<Set<string>>(new Set());

  useEffect(() => {
    rewards.forEach((reward) => {
      const rewardKey = `${reward.type}_${reward.timestamp.getTime()}`;

      // Check if already shown
      if (shownRewards.has(rewardKey)) {
        return;
      }

      // Show notification
      showRewardNotification(reward);

      // Mark as shown
      setShownRewards((prev) => new Set([...prev, rewardKey]));

      // Callback
      if (onRewardShown) {
        onRewardShown(reward);
      }
    });
  }, [rewards]);

  /**
   * Show reward notification
   */
  const showRewardNotification = (reward: InvitationReward) => {
    const messages = {
      registration: '好友注册成功',
      first_game: '好友首次游玩游戏',
      first_redemption: '好友首次兑换奖励',
      membership_purchase: '好友购买会员',
    };

    const message = messages[reward.type] || '邀请奖励';
    const description = reward.invitee_name
      ? `${reward.invitee_name}${message}，您获得了 ${reward.points} 积分奖励！`
      : `${message}，您获得了 ${reward.points} 积分奖励！`;

    notification.success({
      message: (
        <div className="flex items-center gap-2">
          <GiftOutlined style={{ color: '#52c41a' }} />
          <span>邀请奖励</span>
        </div>
      ),
      description: (
        <div>
          <p>{description}</p>
          <div className="flex items-center gap-1 text-orange-500 font-bold mt-2">
            <TrophyOutlined />
            <span>+{reward.points} 积分</span>
          </div>
        </div>
      ),
      placement: 'topRight',
      duration: 5,
      className: 'reward-notification',
    });
  };

  return null; // This component doesn't render anything visible
};

export default InvitationRewardNotification;

