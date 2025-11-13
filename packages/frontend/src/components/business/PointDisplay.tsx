/**
 * Point Display Component
 * Displays points with membership multiplier
 * T114: Implement point multiplier display and application
 */

import React, { useState, useEffect } from 'react';
import { Tooltip, Tag } from 'antd';
import { TrophyOutlined, CrownOutlined } from '@ant-design/icons';
import { getCurrentMembership, type MembershipInfo } from '@/services/api/membership';

interface PointDisplayProps {
  basePoints: number;
  showMultiplier?: boolean;
  size?: 'small' | 'default' | 'large';
}

/**
 * Point Display Component
 */
const PointDisplay: React.FC<PointDisplayProps> = ({
  basePoints,
  showMultiplier = true,
  size = 'default',
}) => {
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMembershipInfo = async () => {
      try {
        const info = await getCurrentMembership();
        setMembershipInfo(info);
      } catch (err) {
        console.error('Failed to fetch membership info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembershipInfo();
  }, []);

  if (loading) {
    return <span>...</span>;
  }

  const multiplier = membershipInfo?.point_multiplier || 1.0;
  const finalPoints = Math.floor(basePoints * multiplier);
  const hasMembership = multiplier > 1.0;

  const fontSize = size === 'small' ? 14 : size === 'large' ? 24 : 18;

  return (
    <div className="inline-flex items-center gap-2" data-testid="point-display">
      {/* Base Points */}
      <span className="flex items-center gap-1" style={{ fontSize }}>
        <TrophyOutlined className="text-orange-500" />
        <strong data-testid="final-points">{finalPoints}</strong>
      </span>

      {/* Multiplier Badge */}
      {hasMembership && showMultiplier && (
        <Tooltip title={`会员积分加成：${multiplier}x (${basePoints} × ${multiplier} = ${finalPoints})`}>
          <Tag
            color="purple"
            icon={<CrownOutlined />}
            className="cursor-help"
            data-testid="multiplier-badge"
          >
            {multiplier}x
          </Tag>
        </Tooltip>
      )}

      {/* Breakdown Tooltip */}
      {hasMembership && showMultiplier && (
        <span className="text-xs text-gray-500">
          (基础 {basePoints} 积分)
        </span>
      )}
    </div>
  );
};

export default PointDisplay;

