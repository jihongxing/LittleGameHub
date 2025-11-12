/**
 * Achievement Progress Component (User Story 8)
 * T214: Create AchievementProgress component
 */

import React from 'react';
import { Progress, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

interface AchievementProgressProps {
  current: number;
  threshold: number;
  title: string;
  description?: string;
}

const AchievementProgress: React.FC<AchievementProgressProps> = ({
  current,
  threshold,
  title,
  description,
}) => {
  const progress = Math.min(Math.round((current / threshold) * 100), 100);
  const isComplete = current >= threshold;

  return (
    <div className="achievement-progress p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          {description && (
            <Tooltip title={description}>
              <InfoCircleOutlined className="text-gray-400" />
            </Tooltip>
          )}
        </div>
        <span className="text-sm text-gray-600">
          {current} / {threshold}
        </span>
      </div>

      <Progress
        percent={progress}
        status={isComplete ? 'success' : 'active'}
        strokeColor={isComplete ? '#52c41a' : '#1890ff'}
      />

      {isComplete && (
        <div className="text-green-600 text-sm mt-2">✓ 已完成！</div>
      )}
    </div>
  );
};

export default AchievementProgress;

