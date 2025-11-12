/**
 * GamePlayer Component
 * Handles game iframe loading and session tracking
 * T055: Create GamePlayer component with iframe sandbox
 * T058: Implement game session tracking with postMessage communication
 * T060: Add error handling for game load failures
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Alert, Card, Space, Typography, Statistic, Modal } from 'antd';
import {
  CloseOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import Loading from '@/components/common/Loading';
import {
  getGameById,
  updateGameSession,
  type Game,
} from '@/services/api/games';

const { Title, Text } = Typography;

/**
 * GamePlayer Component
 */
const GamePlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState<number>(0); // in seconds
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [exitModalVisible, setExitModalVisible] = useState<boolean>(false);
  const [endingSession, setEndingSession] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch game details
   */
  useEffect(() => {
    const fetchGame = async () => {
      if (!id) {
        setError('游戏 ID 无效');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const gameData = await getGameById(id);
        setGame(gameData);

        // Session should be started from GameDetail page
        // Get session ID from navigation state or localStorage
        const storedSessionId = localStorage.getItem(`game_session_${id}`);
        if (storedSessionId) {
          setSessionId(storedSessionId);
          setSessionStartTime(new Date());
        } else {
          setError('未找到游戏会话，请从游戏详情页开始游玩');
        }
      } catch (err: any) {
        console.error('Failed to fetch game:', err);
        setError(err.message || '加载游戏失败');
      } finally {
        setLoading(false);
      }
    };

    fetchGame();

    return () => {
      // Cleanup on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [id]);

  /**
   * Start session timer
   */
  useEffect(() => {
    if (sessionStartTime && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sessionStartTime]);

  /**
   * Handle iframe load
   */
  const handleIframeLoad = () => {
    console.log('Game iframe loaded successfully');
    // TODO: Setup postMessage communication with game
  };

  /**
   * Handle iframe error
   */
  const handleIframeError = () => {
    setError('游戏加载失败，请刷新页面重试');
  };

  /**
   * Toggle fullscreen
   */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      iframeRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  /**
   * Handle exit game
   */
  const handleExitGame = () => {
    setExitModalVisible(true);
  };

  /**
   * Confirm exit and end session
   */
  const confirmExit = async () => {
    if (!game || !sessionId) {
      navigate(-1);
      return;
    }

    try {
      setEndingSession(true);

      // End game session
      const endTime = new Date();
      const result = await updateGameSession(game.id, sessionId, {
        end_time: endTime.toISOString(),
        duration_seconds: duration,
        completion_status: 'completed',
      });

      // Clear stored session
      localStorage.removeItem(`game_session_${game.id}`);

      // Show points earned notification
      if (result.points_earned > 0) {
        Modal.success({
          title: '游戏结束',
          content: (
            <div>
              <p>游玩时长: {formatDuration(duration)}</p>
              <p>获得积分: <strong>{result.points_earned}</strong></p>
              <p>当前积分: {result.new_balance}</p>
            </div>
          ),
          onOk: () => navigate(`/games/${game.id}`),
        });
      } else {
        navigate(`/games/${game.id}`);
      }
    } catch (err: any) {
      console.error('Failed to end session:', err);
      // Still navigate back even if update fails
      navigate(`/games/${game.id}`);
    } finally {
      setEndingSession(false);
    }
  };

  /**
   * Cancel exit
   */
  const cancelExit = () => {
    setExitModalVisible(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" data-testid="loading-spinner">
        <Loading message="加载游戏中..." />
      </div>
    );
  }

  // Error state
  if (error || !game) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4" data-testid="error-message">
        <Alert
          message="游戏加载失败"
          description={error || '未找到游戏'}
          type="error"
          showIcon
          action={
            <Button onClick={() => navigate(`/games/${id}`)}>
              返回游戏详情
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="game-player-page bg-black min-h-screen">
      {/* Control Bar */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Title level={4} className="!mb-0 !text-white">{game.title}</Title>

          {/* Session Timer */}
          <Space size="large">
            <div className="flex items-center gap-2" data-testid="session-timer">
              <ClockCircleOutlined />
              <Text className="text-white">{formatDuration(duration)}</Text>
            </div>

            {duration >= game.min_play_duration_seconds && (
              <div className="flex items-center gap-2 text-green-400">
                <TrophyOutlined />
                <Text className="text-green-400">积分进行中</Text>
              </div>
            )}
          </Space>
        </div>

        {/* Control Buttons */}
        <Space>
          <Button
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? '退出全屏' : '全屏'}
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={handleExitGame}
            data-testid="exit-game-button"
          >
            退出游戏
          </Button>
        </Space>
      </div>

      {/* Game Iframe */}
      <div className="game-container" style={{ height: 'calc(100vh - 72px)' }}>
        <iframe
          ref={iframeRef}
          src={game.game_url}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title={game.title}
          data-testid="game-iframe"
        />
      </div>

      {/* Exit Confirmation Modal */}
      <Modal
        title="确认退出"
        open={exitModalVisible}
        onOk={confirmExit}
        onCancel={cancelExit}
        confirmLoading={endingSession}
        okText="确认退出"
        cancelText="继续游玩"
      >
        <Space direction="vertical" className="w-full">
          <Text>确定要退出游戏吗？</Text>
          <Card size="small">
            <Statistic
              title="游玩时长"
              value={formatDuration(duration)}
              valueStyle={{ fontSize: '16px' }}
            />
            {duration >= game.min_play_duration_seconds ? (
              <Text type="success">
                已达到最少游玩时长，退出后将获得积分奖励
              </Text>
            ) : (
              <Text type="warning">
                还需游玩 {formatDuration(game.min_play_duration_seconds - duration)} 才能获得积分
              </Text>
            )}
          </Card>
        </Space>
      </Modal>
    </div>
  );
};

/**
 * Format duration in seconds to HH:MM:SS
 */
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default GamePlayer;
