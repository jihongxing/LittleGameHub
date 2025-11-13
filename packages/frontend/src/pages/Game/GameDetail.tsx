/**
 * GameDetail Page
 * Displays detailed information about a game
 * T054: Create GameDetail page component
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Tag,
  Rate,
  Descriptions,
  Card,
  Alert,
  Space,
  Divider,
  Typography,
  message,
} from 'antd';
import {
  PlayCircleOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import Loading from '@/components/common/Loading';
import { getGameById, startGameSession, type Game } from '@/services/api/games';
import AddToCollectionButton from '@/components/business/AddToCollectionButton';
import OfflineDownloadButton from '@/components/business/OfflineDownloadButton';

const { Title, Paragraph, Text } = Typography;

/**
 * GameDetail Page Component
 */
const GameDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startingSession, setStartingSession] = useState<boolean>(false);

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
      } catch (err: any) {
        console.error('Failed to fetch game:', err);

        if (err.response?.status === 404) {
          setError('游戏未找到');
        } else {
          setError(err.message || '加载游戏失败，请稍后重试');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [id]);

  /**
   * Handle play button click
   */
  const handlePlay = async () => {
    if (!game) return;

    try {
      setStartingSession(true);
      // Start game session
      const sessionResponse = await startGameSession(game.id);
      
      // Save session ID to localStorage for GamePlayer component
      localStorage.setItem(`game_session_${game.id}`, sessionResponse.session_id);
      
      // Navigate to game player
      navigate(`/games/${game.id}/play`);
    } catch (err: any) {
      console.error('Failed to start game session:', err);
      message.error(err.message || '无法启动游戏，请稍后重试');
    } finally {
      setStartingSession(false);
    }
  };

  /**
   * Handle back button
   */
  const handleBack = () => {
    navigate('/games');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" data-testid="loading-spinner">
        <Loading message="加载游戏详情中..." />
      </div>
    );
  }

  // Error state
  if (error || !game) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4" data-testid="error-message">
        <Alert
          message={error || '游戏未找到'}
          description="请返回游戏列表选择其他游戏"
          type="error"
          showIcon
          action={
            <Button size="small" onClick={handleBack} data-testid="back-to-games">
              返回游戏列表
            </Button>
          }
        />
      </div>
    );
  }

  const isPlayable = game.availability_status === 'active';

  return (
    <div className="game-detail-page min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className="mb-4"
          data-testid="back-button"
        >
          返回
        </Button>

        {/* Game Header Card */}
        <Card className="mb-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Cover Image */}
            <div className="md:col-span-1">
              <img
                src={game.cover_image_url}
                alt={game.title}
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>

            {/* Game Info */}
            <div className="md:col-span-2 space-y-4">
              {/* Title and Status */}
              <div>
                <Space align="center" className="mb-2">
                  <Title level={2} className="!mb-0">{game.title}</Title>
                  {game.is_featured && <Tag color="gold">精选</Tag>}
                </Space>

                {/* Availability Warning */}
                {!isPlayable && (
                  <Alert
                    message={
                      game.availability_status === 'maintenance'
                        ? '游戏维护中'
                        : '游戏暂不可用'
                    }
                    type="warning"
                    showIcon
                    className="mb-4"
                  />
                )}
              </div>

              {/* Category Tags */}
              <div>
                {game.category_tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>

              {/* Rating and Stats */}
              <Space size="large" wrap>
                {game.average_rating !== null ? (
                  <div className="flex items-center gap-2">
                    <Rate disabled value={game.average_rating} />
                    <Text strong>{game.average_rating.toFixed(1)}</Text>
                  </div>
                ) : (
                  <Text type="secondary">暂无评分</Text>
                )}

                <div className="flex items-center gap-1 text-gray-600">
                  <UserOutlined />
                  <Text>{formatPlayCount(game.play_count)} 次游玩</Text>
                </div>

                <div className="flex items-center gap-1 text-gray-600">
                  <Text type="secondary">版本 {game.version}</Text>
                </div>
              </Space>

              {/* Action Buttons */}
              <div>
                <Space wrap>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlayCircleOutlined />}
                    onClick={handlePlay}
                    disabled={!isPlayable}
                    loading={startingSession}
                    data-testid="play-button"
                  >
                    立即游玩
                  </Button>
                  
                <AddToCollectionButton
                    gameId={Number(game.id)}
                    gameTitle={game.title}
                    size="large"
                />

                <OfflineDownloadButton
                    gameId={Number(game.id)}
                    gameTitle={game.title}
                    gameUrl={game.game_url || ''}
                    fileSize={(game as any).file_size || 0}
                    size="large"
                />
                </Space>
              </div>
            </div>
          </div>
        </Card>

        {/* Game Description */}
        <Card title="游戏简介" className="mb-6">
          <Paragraph data-testid="game-description">{game.description}</Paragraph>
        </Card>

        {/* Point Rewards Info */}
        <Card title={<span><TrophyOutlined /> 积分奖励规则</span>} className="mb-6">
          <Space direction="vertical" size="middle" className="w-full">
            <Alert
              message={`最高可获得 ${game.point_reward_rules.max_points_per_session} 积分`}
              type="info"
              showIcon
            />
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="基础积分">
                {game.point_reward_rules.base_points} 积分
              </Descriptions.Item>
              <Descriptions.Item label="每分钟奖励">
                {game.point_reward_rules.points_per_minute} 积分/分钟
              </Descriptions.Item>
              <Descriptions.Item label="最少游玩时长">
                {Math.floor(game.point_reward_rules.min_duration_seconds / 60)} 分钟
              </Descriptions.Item>
              <Descriptions.Item label="单次最高积分">
                {game.point_reward_rules.max_points_per_session} 积分
              </Descriptions.Item>
            </Descriptions>
            <Alert
              message={`游玩至少 ${Math.floor(game.min_play_duration_seconds / 60)} 分钟即可获得积分奖励`}
              type="success"
              showIcon
              icon={<ClockCircleOutlined />}
            />
          </Space>
        </Card>

        {/* Game Details */}
        <Card title="游戏详情">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="游戏分类">
              {game.category_tags.join(', ')}
            </Descriptions.Item>
            <Descriptions.Item label="游戏版本">
              {game.version}
            </Descriptions.Item>
            <Descriptions.Item label="游玩次数">
              {game.play_count.toLocaleString()} 次
            </Descriptions.Item>
            {game.average_rating !== null && (
              <Descriptions.Item label="平均评分">
                {game.average_rating.toFixed(1)} / 5.0
              </Descriptions.Item>
            )}
            <Descriptions.Item label="发布时间">
              {new Date(game.created_at).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label="最后更新">
              {new Date(game.updated_at).toLocaleDateString()}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </div>
  );
};

/**
 * Format play count with K/M notation
 */
const formatPlayCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export default GameDetail;
