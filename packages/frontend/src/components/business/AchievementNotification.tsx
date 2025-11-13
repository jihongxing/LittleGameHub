/**
 * Achievement Unlock Notification Component (User Story 8)
 * T215: Implement achievement unlock notification
 */

import React, { useEffect } from 'react';
import { notification } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import type { Achievement } from '@/services/api/achievements';
import { getRarityColor, getRarityLabel } from '@/services/api/achievements';

interface AchievementNotificationProps {
  achievement: Achievement;
  points: number;
  onClose?: () => void;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  points,
  onClose,
}) => {
  useEffect(() => {
    showAchievementNotification(achievement, points, onClose);
  }, [achievement, points, onClose]);

  return null;
};

/**
 * Show achievement unlock notification
 */
export function showAchievementNotification(
  achievement: Achievement,
  points: number,
  onClose?: () => void,
): void {
  const rarityColor = getRarityColor(achievement.rarity);
  const rarityLabel = getRarityLabel(achievement.rarity);

  notification.open({
    message: (
      <div style={{ color: rarityColor, fontWeight: 'bold' }}>
        <TrophyOutlined /> 成就解锁！
      </div>
    ),
    description: (
      <div>
        <div className="font-medium text-lg mb-1">{achievement.title}</div>
        <div className="text-gray-600 mb-2">{achievement.description}</div>
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: `${rarityColor}20`,
              color: rarityColor,
            }}
          >
            {rarityLabel}
          </span>
          <span className="text-yellow-600">+{points} 积分</span>
        </div>
      </div>
    ),
    icon: <TrophyOutlined style={{ color: rarityColor }} />,
    placement: 'topRight',
    duration: 5,
    style: {
      borderLeft: `4px solid ${rarityColor}`,
    },
    onClose,
  });
}

/**
 * Show multiple achievements unlocked notification
 */
export function showMultipleAchievementsNotification(
  achievements: Achievement[],
  totalPoints: number,
  onClose?: () => void,
): void {
  notification.open({
    message: (
      <div style={{ color: '#FFD700', fontWeight: 'bold' }}>
        <TrophyOutlined /> {achievements.length} 个成就解锁！
      </div>
    ),
    description: (
      <div>
        {achievements.slice(0, 3).map((achievement) => (
          <div key={achievement.id} className="mb-1">
            • {achievement.title}
          </div>
        ))}
        {achievements.length > 3 && (
          <div className="text-gray-500">...还有 {achievements.length - 3} 个</div>
        )}
        <div className="mt-2 text-yellow-600">总计 +{totalPoints} 积分</div>
      </div>
    ),
    icon: <TrophyOutlined style={{ color: '#FFD700' }} />,
    placement: 'topRight',
    duration: 6,
    onClose,
  });
}

export default AchievementNotification;

