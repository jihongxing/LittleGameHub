/**
 * Offline Download Button Component
 * Integration 2: 游戏详情页添加"离线下载"按钮
 */

import React, { useState, useEffect } from 'react';
import { Button, Modal, Progress, message, Alert, Space } from 'antd';
import { DownloadOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import * as offlineApi from '@/services/api/offline';
import type { OfflineGame } from '@/services/api/offline';
import { downloadQueue } from '@/utils/download-queue';
import { registerBackgroundDownload, isBackgroundSyncSupported } from '@/utils/background-sync';

interface OfflineDownloadButtonProps {
  gameId: number;
  gameTitle: string;
  gameUrl: string;
  fileSize?: number;
  size?: 'small' | 'middle' | 'large';
  block?: boolean;
}

const OfflineDownloadButton: React.FC<OfflineDownloadButtonProps> = ({
  gameId,
  gameTitle,
  gameUrl,
  fileSize = 0,
  size = 'middle',
  block = false,
}) => {
  const [offlineGame, setOfflineGame] = useState<OfflineGame | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [downloadMode, setDownloadMode] = useState<'normal' | 'background'>('normal');
  const [checking, setChecking] = useState(true);

  // Check if game is already downloaded
  const checkDownloadStatus = async () => {
    setChecking(true);
    try {
      const games = await offlineApi.getOfflineGames();
      const existingGame = games.games.find(g => g.game_id === gameId);
      setOfflineGame(existingGame || null);
    } catch (error) {
      console.error('Failed to check download status:', error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkDownloadStatus();
  }, [gameId]);

  // Handle download
  const handleDownload = async () => {
    setLoading(true);
    try {
      if (downloadMode === 'background' && isBackgroundSyncSupported()) {
        // Use background sync
        await registerBackgroundDownload(gameId, gameTitle, gameUrl);
        message.success('已添加到后台下载队列');
      } else {
        // Use download queue
        await offlineApi.downloadGame(gameId);
        downloadQueue.addToQueue(gameId, gameTitle, gameUrl, fileSize);
        message.success('下载已开始');
      }

      setModalVisible(false);
      checkDownloadStatus();
    } catch (error: any) {
      if (error.response?.status === 403) {
        message.error('存储空间不足，请升级会员或删除一些游戏');
      } else if (error.response?.status === 409) {
        message.warning('该游戏已在下载队列中');
      } else {
        message.error('下载失败，请重试');
      }
      console.error('Failed to start download:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '未知大小';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Get button props based on status
  const getButtonProps = () => {
    if (checking) {
      return {
        icon: <ClockCircleOutlined />,
        children: '检查中...',
        disabled: true,
      };
    }

    if (offlineGame) {
      if (offlineGame.download_status === 'completed') {
        return {
          icon: <CheckCircleOutlined />,
          children: '已下载',
          disabled: true,
          type: 'default' as const,
        };
      }

      if (offlineGame.download_status === 'downloading') {
        return {
          icon: <DownloadOutlined />,
          children: `下载中 ${offlineGame.progress_percentage}%`,
          disabled: true,
          type: 'primary' as const,
        };
      }
    }

    return {
      icon: <DownloadOutlined />,
      children: '离线下载',
      onClick: () => setModalVisible(true),
    };
  };

  const buttonProps = getButtonProps();

  return (
    <>
      <Button
        {...buttonProps}
        size={size}
        block={block}
        loading={loading}
      />

      <Modal
        title="离线下载"
        open={modalVisible}
        onOk={handleDownload}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        okText="开始下载"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <div className="text-gray-600 text-sm mb-1">游戏</div>
            <div className="font-medium">{gameTitle}</div>
          </div>

          <div>
            <div className="text-gray-600 text-sm mb-1">文件大小</div>
            <div>{formatFileSize(fileSize)}</div>
          </div>

          {isBackgroundSyncSupported() && (
            <div>
              <div className="text-gray-600 text-sm mb-2">下载模式</div>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type={downloadMode === 'normal' ? 'primary' : 'default'}
                  onClick={() => setDownloadMode('normal')}
                  block
                >
                  立即下载
                </Button>
                <Button
                  type={downloadMode === 'background' ? 'primary' : 'default'}
                  onClick={() => setDownloadMode('background')}
                  block
                >
                  后台下载（稍后进行）
                </Button>
              </Space>
            </div>
          )}

          <Alert
            message="提示"
            description="下载的游戏将保存在本地，可在无网络环境下游玩。"
            type="info"
            showIcon
          />

          {fileSize > 50 * 1024 * 1024 && (
            <Alert
              message="大文件下载"
              description="该游戏文件较大，建议在 WiFi 环境下下载。"
              type="warning"
              showIcon
            />
          )}
        </Space>
      </Modal>
    </>
  );
};

export default OfflineDownloadButton;

