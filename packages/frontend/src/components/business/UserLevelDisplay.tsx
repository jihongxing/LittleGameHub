/**
 * User Level Display Component (User Story 8)
 * T216: Implement user level display
 */

import React from 'react';
import { Progress, Tooltip, Tag } from 'antd';
import { TrophyOutlined, StarOutlined } from '@ant-design/icons';

export interface UserLevelInfo {
  level: number;
  currentExp: number;
  expForNextLevel: number;
  totalExp: number;
  progress: number;
  tier?: {
    tier: string;
    color: string;
    minLevel: number;
    maxLevel: number;
  };
}

interface UserLevelDisplayProps {
  levelInfo: UserLevelInfo;
  compact?: boolean;
}

const UserLevelDisplay: React.FC<UserLevelDisplayProps> = ({ levelInfo, compact = false }) => {
  const { level, currentExp, expForNextLevel, progress, tier } = levelInfo;

  if (compact) {
    return (
      <Tooltip
        title={`等级 ${level} - ${currentExp}/${expForNextLevel} 经验 (${progress}%)`}
      >
        <div className="user-level-compact flex items-center gap-2">
          <div
            className="level-badge"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: tier?.color || '#1890ff',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 14,
            }}
          >
            {level}
          </div>
          {tier && (
            <Tag color={tier.color} style={{ margin: 0 }}>
              {tier.tier}
            </Tag>
          )}
        </div>
      </Tooltip>
    );
  }

  return (
    <div className="user-level-display p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Level Badge */}
          <div
            className="level-badge"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: tier?.color || '#1890ff',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              boxShadow: `0 4px 12px ${tier?.color || '#1890ff'}40`,
            }}
          >
            <div className="text-xs">等级</div>
            <div className="text-2xl">{level}</div>
          </div>

          {/* Tier and Title */}
          <div>
            {tier && (
              <Tag
                color={tier.color}
                icon={<StarOutlined />}
                style={{ fontSize: 16, padding: '4px 12px' }}
              >
                {tier.tier}
              </Tag>
            )}
            <div className="text-sm text-gray-600 mt-1">
              {tier && `${tier.minLevel}-${tier.maxLevel} 级`}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{currentExp}</div>
          <div className="text-sm text-gray-600">/ {expForNextLevel} 经验</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">升级进度</span>
          <span className="text-sm font-medium text-blue-600">{progress}%</span>
        </div>
        <Progress
          percent={progress}
          strokeColor={{
            '0%': tier?.color || '#1890ff',
            '100%': tier?.color || '#87d068',
          }}
          status="active"
          showInfo={false}
        />
      </div>

      {/* Next Level Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-900 flex items-center gap-2">
        <TrophyOutlined />
        <span>还需 {expForNextLevel - currentExp} 经验升至 {level + 1} 级</span>
      </div>
    </div>
  );
};

export default UserLevelDisplay;

