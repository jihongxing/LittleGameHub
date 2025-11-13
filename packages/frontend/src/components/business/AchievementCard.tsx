/**
 * Achievement Card Component (User Story 8)
 * T213: Create AchievementCard component
 */

import React from 'react';
import { Card, Progress, Tag } from 'antd';
import { TrophyOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { AchievementProgress } from '@/services/api/achievements';
import { getRarityColor, getRarityLabel } from '@/services/api/achievements';

interface AchievementCardProps {
  achievementProgress: AchievementProgress;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievementProgress }) => {
  const { achievement, unlocked, progress, unlocked_at } = achievementProgress;

  // Get rarity color and label
  const rarityColor = getRarityColor(achievement.rarity);
  const rarityLabel = getRarityLabel(achievement.rarity);

  return (
    <Card
      hoverable
      className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}
      style={{
        borderColor: unlocked ? rarityColor : '#d9d9d9',
        opacity: unlocked ? 1 : 0.7,
      }}
    >
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div
          className="achievement-icon mb-3"
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: unlocked
              ? `linear-gradient(135deg, ${rarityColor}20, ${rarityColor}40)`
              : '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            color: unlocked ? rarityColor : '#999',
          }}
        >
          {unlocked ? (
            <CheckCircleOutlined />
          ) : achievement.is_hidden ? (
            <LockOutlined />
          ) : (
            <TrophyOutlined />
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-2">{achievement.title}</h3>

        {/* Rarity Badge */}
        <Tag color={rarityColor} className="mb-2">
          {rarityLabel}
        </Tag>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3" style={{ minHeight: 40 }}>
          {achievement.description}
        </p>

        {/* Progress or Unlocked Status */}
        {unlocked ? (
          <div className="w-full">
            <div className="text-green-600 font-medium flex items-center justify-center gap-1 mb-2">
              <CheckCircleOutlined />
              已解锁
            </div>
            {unlocked_at && (
              <div className="text-xs text-gray-500">
                {new Date(unlocked_at).toLocaleDateString('zh-CN')}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full">
            {progress > 0 ? (
              <>
                <div className="text-sm text-gray-600 mb-2">进度: {progress}%</div>
                <Progress percent={progress} size="small" status="active" />
              </>
            ) : (
              <div className="text-gray-500">未开始</div>
            )}
          </div>
        )}

        {/* Points Reward */}
        <div className="mt-3 pt-3 border-t border-gray-200 w-full text-center">
          <span className="text-sm text-gray-600">奖励: </span>
          <span className="text-sm font-medium text-yellow-600">
            {achievement.points_reward} 积分
          </span>
        </div>
      </div>
    </Card>
  );
};

export default AchievementCard;

