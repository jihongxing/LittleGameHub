/**
 * Download Progress Component (User Story 7)
 * T200: Component for displaying download progress indicator
 */

import React, { useEffect, useState } from 'react';
import { Progress, Space, Button, message } from 'antd';
import { PauseOutlined, PlayCircleOutlined, CloseOutlined } from '@ant-design/icons';
import * as offlineApi from '@/services/api/offline';

interface DownloadProgressProps {
  offlineGameId: number;
  onComplete?: () => void;
  onCancel?: () => void;
}

const DownloadProgress: React.FC<DownloadProgressProps> = ({
  offlineGameId,
  onComplete,
  onCancel,
}) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'downloading' | 'paused' | 'completed' | 'failed'>('downloading');
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);

  // Fetch download progress
  const fetchProgress = async () => {
    try {
      const game = await offlineApi.getDownloadProgress(offlineGameId);
      setProgress(game.progress_percentage);
      setDownloadedBytes(game.downloaded_bytes);
      setTotalBytes(game.file_size || 0);
      setStatus(game.download_status as any);

      if (game.download_status === 'completed') {
        onComplete?.();
      }
    } catch (error) {
      console.error('Fetch progress error:', error);
    }
  };

  useEffect(() => {
    fetchProgress();

    // Poll for updates every 2 seconds
    const interval = setInterval(() => {
      if (status !== 'completed' && status !== 'failed') {
        fetchProgress();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [offlineGameId, status]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Handle cancel
  const handleCancel = async () => {
    try {
      // Note: You would need to implement cancel endpoint in the backend
      message.info('下载已取消');
      onCancel?.();
    } catch (error) {
      message.error('取消失败');
      console.error('Cancel download error:', error);
    }
  };

  return (
    <div className="download-progress p-4 bg-white rounded shadow">
      <Space direction="vertical" style={{ width: '100%' }}>
        <div className="flex justify-between items-center">
          <span className="font-medium">下载进度</span>
          <Button
            type="text"
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={handleCancel}
          >
            取消
          </Button>
        </div>

        <Progress
          percent={progress}
          status={status === 'failed' ? 'exception' : status === 'completed' ? 'success' : 'active'}
        />

        <div className="flex justify-between text-sm text-gray-600">
          <span>
            {formatFileSize(downloadedBytes)} / {formatFileSize(totalBytes)}
          </span>
          <span>{progress.toFixed(1)}%</span>
        </div>

        {status === 'failed' && (
          <div className="text-red-500 text-sm">下载失败，请重试</div>
        )}
        {status === 'completed' && (
          <div className="text-green-500 text-sm">下载完成！</div>
        )}
      </Space>
    </div>
  );
};

export default DownloadProgress;

