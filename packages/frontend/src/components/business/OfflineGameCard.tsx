/**
 * Offline Game Card Component (User Story 7)
 * T198: Card component for displaying offline game
 */

import React from 'react';
import { Card, Progress, Tag, Button, Space, Popconfirm } from 'antd';
import { PlayCircleOutlined, DeleteOutlined, DownloadOutlined, PauseOutlined } from '@ant-design/icons';
import type { OfflineGame } from '@/services/api/offline';

interface OfflineGameCardProps {
  game: OfflineGame;
  onDelete: (gameId: number) => void;
  onRefresh: () => void;
}

const OfflineGameCard: React.FC<OfflineGameCardProps> = ({ game, onDelete, onRefresh }) => {
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'downloading':
        return 'processing';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'paused':
        return 'default';
      default:
        return 'default';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'downloading':
        return '下载中';
      case 'pending':
        return '等待中';
      case 'failed':
        return '失败';
      case 'paused':
        return '已暂停';
      default:
        return status;
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card
      cover={
        <div style={{ height: 150, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PlayCircleOutlined style={{ fontSize: 48, color: 'white' }} />
        </div>
      }
      actions={[
        game.download_status === 'completed' && (
          <Button type="text" icon={<PlayCircleOutlined />}>
            游玩
          </Button>
        ),
        <Popconfirm
          title="确定要删除这个离线游戏吗？"
          onConfirm={() => onDelete(game.game_id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="text" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>,
      ].filter(Boolean)}
    >
      <Card.Meta
        title={
          <Space>
            <span>游戏 {game.game_id}</span>
            <Tag color={getStatusColor(game.download_status)}>
              {getStatusText(game.download_status)}
            </Tag>
          </Space>
        }
        description={
          <div>
            {game.download_status === 'downloading' || game.download_status === 'pending' ? (
              <div className="mt-2">
                <Progress percent={game.progress_percentage} size="small" />
                <div className="text-xs text-gray-500 mt-1">
                  {formatFileSize(game.downloaded_bytes)} / {formatFileSize(game.file_size)}
                </div>
              </div>
            ) : (
              <div className="text-gray-600 mt-2">
                <div>文件大小: {formatFileSize(game.file_size)}</div>
                {game.download_status === 'completed' && (
                  <div className="text-xs text-gray-500 mt-1">
                    下载于 {new Date(game.created_at).toLocaleDateString('zh-CN')}
                  </div>
                )}
              </div>
            )}
          </div>
        }
      />
    </Card>
  );
};

export default OfflineGameCard;

