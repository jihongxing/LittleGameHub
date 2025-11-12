/**
 * Storage Quota Display Component (User Story 7)
 * T199: Component for displaying storage quota information
 */

import React from 'react';
import { Card, Progress, Space, Tag } from 'antd';
import { CloudOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import type { StorageQuota } from '@/services/api/offline';

interface StorageQuotaDisplayProps {
  storage: StorageQuota;
}

const StorageQuotaDisplay: React.FC<StorageQuotaDisplayProps> = ({ storage }) => {
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Get tier display info
  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'free':
        return { text: '免费用户', color: 'default' };
      case 'member':
        return { text: '会员', color: 'blue' };
      case 'offline_member':
        return { text: '离线会员', color: 'gold' };
      default:
        return { text: tier, color: 'default' };
    }
  };

  // Get progress color
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return '#ff4d4f';
    if (percentage >= 70) return '#faad14';
    return '#52c41a';
  };

  const tierInfo = getTierInfo(storage.tier);
  const isNearLimit = storage.percentage_used >= 80;

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div className="flex justify-between items-center">
          <Space>
            <CloudOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <div>
              <div className="font-semibold text-lg">存储空间</div>
              <Space size="small">
                <Tag color={tierInfo.color}>{tierInfo.text}</Tag>
                {isNearLimit && (
                  <Tag color="warning" icon={<WarningOutlined />}>
                    空间不足
                  </Tag>
                )}
              </Space>
            </div>
          </Space>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatFileSize(storage.used)} / {formatFileSize(storage.total)}
            </div>
            <div className="text-sm text-gray-500">
              剩余 {formatFileSize(storage.available)}
            </div>
          </div>
        </div>

        <div>
          <Progress
            percent={Math.round(storage.percentage_used)}
            strokeColor={getProgressColor(storage.percentage_used)}
            status={storage.percentage_used >= 100 ? 'exception' : 'active'}
          />
        </div>

        {storage.tier === 'free' && (
          <div className="bg-blue-50 p-3 rounded text-sm text-blue-900">
            <CheckCircleOutlined className="mr-2" />
            升级为会员可获得 5GB 存储空间，离线会员可获得 20GB 存储空间
          </div>
        )}
      </Space>
    </Card>
  );
};

export default StorageQuotaDisplay;

