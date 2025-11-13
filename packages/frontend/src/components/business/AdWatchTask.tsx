/**
 * Ad Watch Task Component
 * Simulates ad watching for earning points
 * T090: Implement ad watching task integration
 */

import React, { useState, useEffect } from 'react';
import { Modal, Progress, Button, Result } from 'antd';
import { PlayCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { completeTask } from '@/services/api/points';

interface AdWatchTaskProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (pointsEarned: number) => void;
}

/**
 * Ad Watch Task Component
 */
const AdWatchTask: React.FC<AdWatchTaskProps> = ({ visible, onClose, onComplete }) => {
  const [adStatus, setAdStatus] = useState<'ready' | 'playing' | 'completed' | 'error'>('ready');
  const [progress, setProgress] = useState<number>(0);
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const AD_DURATION = 15; // 15 seconds

  /**
   * Reset state when modal opens/closes
   */
  useEffect(() => {
    if (visible) {
      setAdStatus('ready');
      setProgress(0);
      setPointsEarned(0);
      setErrorMessage('');
    }
  }, [visible]);

  /**
   * Start watching ad
   */
  const handleStartAd = () => {
    setAdStatus('playing');
    setProgress(0);

    // Simulate ad progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 / AD_DURATION);
        if (next >= 100) {
          clearInterval(interval);
          handleAdComplete();
          return 100;
        }
        return next;
      });
    }, 1000);
  };

  /**
   * Handle ad completion
   */
  const handleAdComplete = async () => {
    try {
      // Call API to complete task
      const result = await completeTask('watch_ad', {
        ad_id: `ad_${Date.now()}`,
        duration: AD_DURATION,
      });

      setPointsEarned(result.points_earned);
      setAdStatus('completed');
    } catch (err: any) {
      console.error('Failed to complete ad task:', err);
      setAdStatus('error');
      setErrorMessage(err.response?.data?.message || '完成任务失败');
    }
  };

  /**
   * Handle finish button click
   */
  const handleFinish = () => {
    if (adStatus === 'completed') {
      onComplete(pointsEarned);
    }
    onClose();
  };

  /**
   * Render content based on status
   */
  const renderContent = () => {
    switch (adStatus) {
      case 'ready':
        return (
          <div className="text-center py-8" data-testid="ad-ready">
            <PlayCircleOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
            <h3 className="text-xl font-semibold mb-2">观看广告赚积分</h3>
            <p className="text-gray-600 mb-4">
              观看 {AD_DURATION} 秒广告，即可获得积分奖励
            </p>
            <Button type="primary" size="large" onClick={handleStartAd}>
              开始观看
            </Button>
          </div>
        );

      case 'playing':
        return (
          <div className="text-center py-8" data-testid="ad-playing">
            {/* Simulated Ad Content */}
            <div className="mb-6 p-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
              <h2 className="text-2xl font-bold mb-2">广告内容</h2>
              <p>这是一个模拟广告...</p>
            </div>

            {/* Progress */}
            <div className="px-8">
              <Progress
                percent={Math.floor(progress)}
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <p className="text-gray-600 mt-2">
                请耐心观看广告... ({Math.floor((AD_DURATION * progress) / 100)} / {AD_DURATION} 秒)
              </p>
            </div>
          </div>
        );

      case 'completed':
        return (
          <Result
            status="success"
            icon={<TrophyOutlined style={{ color: '#52c41a' }} />}
            title="观看完成"
            subTitle={
              <div data-testid="ad-completed">
                <p className="text-lg">
                  恭喜获得 <strong className="text-orange-500 text-2xl">{pointsEarned}</strong> 积分
                </p>
              </div>
            }
            extra={[
              <Button type="primary" size="large" onClick={handleFinish} key="finish">
                完成
              </Button>,
            ]}
          />
        );

      case 'error':
        return (
          <Result
            status="error"
            title="任务失败"
            subTitle={errorMessage || '观看广告任务失败，请稍后重试'}
            extra={[
              <Button key="close" onClick={onClose}>
                关闭
              </Button>,
            ]}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title={adStatus === 'playing' ? '广告播放中' : '观看广告'}
      open={visible}
      onCancel={adStatus === 'playing' ? undefined : onClose}
      footer={null}
      closable={adStatus !== 'playing'}
      maskClosable={false}
      width={600}
      data-testid="ad-watch-modal"
    >
      {renderContent()}
    </Modal>
  );
};

export default AdWatchTask;

