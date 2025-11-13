/**
 * 聚合游戏详情页面
 * Aggregated Game Detail Page
 * 
 * 显示单个聚合游戏的详细信息
 * Displays detailed information of an aggregated game
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Tag, Rate, Spin, Empty, Row, Col, Divider, Space, Badge, Tooltip } from 'antd';
import { ArrowLeftOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { gamesApi } from '@/services/api/games';
import type { Game } from '@/services/api/games';

const AggregatedGameDetailPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) return;
      setLoading(true);
      try {
        const data = await gamesApi.getGameById(gameId);
        setGame(data);
        setError(null);
      } catch (err) {
        setError('加载游戏详情失败');
        console.error('Failed to fetch game:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="p-6">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          返回
        </Button>
        <Empty description={error || '游戏不存在'} />
      </div>
    );
  }

  // 获取游戏来源信息
  const sourceInfo = {
    rawg: { label: 'RAWG', color: 'blue', icon: '📚' },
    itch: { label: 'Itch.io', color: 'purple', icon: '🎨' },
    igdb: { label: 'IGDB', color: 'cyan', icon: '🌟' },
    wechat: { label: '微信小游戏', color: 'green', icon: '🎮' },
    douyin: { label: '抖音小游戏', color: 'red', icon: '📱' },
  };

  const source = (game as any).source as keyof typeof sourceInfo;
  const sourceData = sourceInfo[source] || { label: '未知来源', color: 'default', icon: '❓' };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 返回按钮 */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        返回
      </Button>

      <Row gutter={[24, 24]}>
        {/* 左侧：游戏封面 */}
        <Col xs={24} md={8}>
          <Card
            cover={
              <div className="relative">
                <img
                  alt={game.title}
                  src={game.cover_image_url}
                  className="w-full h-96 object-cover"
                />
                {game.is_featured && (
                  <div className="absolute top-4 right-4">
                    <Tag color="gold">⭐ 精选</Tag>
                  </div>
                )}
              </div>
            }
            className="sticky top-4"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 游戏来源 */}
              <div>
                <p className="text-gray-600 mb-2">游戏来源</p>
                <Badge
                  color={sourceData.color}
                  text={`${sourceData.icon} ${sourceData.label}`}
                />
              </div>

              {/* 游戏链接 */}
              {(game as any).source_url && (
                <div>
                  <p className="text-gray-600 mb-2">原始链接</p>
                  <Button
                    type="primary"
                    block
                    href={(game as any).source_url}
                    target="_blank"
                  >
                    🔗 访问原始游戏
                  </Button>
                </div>
              )}

              {/* 游戏URL */}
              {game.game_url && (
                <div>
                  <p className="text-gray-600 mb-2">游戏地址</p>
                  <Button
                    type="default"
                    block
                    icon={<PlayCircleOutlined />}
                    href={game.game_url}
                    target="_blank"
                  >
                    开始游戏
                  </Button>
                </div>
              )}

              {/* 可用性状态 */}
              <div>
                <p className="text-gray-600 mb-2">状态</p>
                {game.availability_status === 'active' && (
                  <Tag color="green">✅ 可用</Tag>
                )}
                {game.availability_status === 'maintenance' && (
                  <Tag color="orange">🔧 维护中</Tag>
                )}
                {game.availability_status === 'inactive' && (
                  <Tag color="red">❌ 不可用</Tag>
                )}
              </div>
            </Space>
          </Card>
        </Col>

        {/* 右侧：游戏信息 */}
        <Col xs={24} md={16}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 标题 */}
              <div>
                <h1 className="text-3xl font-bold mb-2">{game.title}</h1>
                <p className="text-gray-600">{game.version}</p>
              </div>

              <Divider />

              {/* 评分和统计 */}
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={8}>
                  <div className="text-center">
                    <p className="text-gray-600 mb-2">评分</p>
                    {game.average_rating !== null ? (
                      <>
                        <Rate disabled defaultValue={game.average_rating} count={5} />
                        <p className="text-lg font-bold mt-2">{game.average_rating.toFixed(1)}</p>
                      </>
                    ) : (
                      <p className="text-gray-400">暂无评分</p>
                    )}
                  </div>
                </Col>
                <Col xs={12} sm={8}>
                  <div className="text-center">
                    <p className="text-gray-600 mb-2">游玩次数</p>
                    <p className="text-2xl font-bold">{formatPlayCount(game.play_count)}</p>
                  </div>
                </Col>
                <Col xs={12} sm={8}>
                  <div className="text-center">
                    <p className="text-gray-600 mb-2">最高积分</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {game.point_reward_rules.max_points_per_session}
                    </p>
                  </div>
                </Col>
              </Row>

              <Divider />

              {/* 描述 */}
              <div>
                <h3 className="text-lg font-semibold mb-2">游戏描述</h3>
                <p className="text-gray-700 leading-relaxed">{game.description}</p>
              </div>

              <Divider />

              {/* 分类标签 */}
              {game.category_tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">分类</h3>
                  <Space wrap>
                    {game.category_tags.map((tag) => (
                      <Tag key={tag} color="blue">
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}

              {/* 游戏元数据 */}
              {((game as any).genres || (game as any).platforms || (game as any).release_date) && (
                <>
                  <Divider />
                  <Row gutter={[16, 16]}>
                    {(game as any).genres && (
                      <Col xs={24} sm={12}>
                        <h4 className="font-semibold mb-2">游戏类型</h4>
                        <Space wrap>
                          {(game as any).genres.map((genre: string) => (
                            <Tag key={genre}>{genre}</Tag>
                          ))}
                        </Space>
                      </Col>
                    )}
                    {(game as any).platforms && (
                      <Col xs={24} sm={12}>
                        <h4 className="font-semibold mb-2">游戏平台</h4>
                        <Space wrap>
                          {(game as any).platforms.map((platform: string) => (
                            <Tag key={platform} color="cyan">
                              {platform}
                            </Tag>
                          ))}
                        </Space>
                      </Col>
                    )}
                    {(game as any).release_date && (
                      <Col xs={24}>
                        <h4 className="font-semibold mb-2">发布日期</h4>
                        <p className="text-gray-700">{(game as any).release_date}</p>
                      </Col>
                    )}
                  </Row>
                </>
              )}

              <Divider />

              {/* 积分规则 */}
              <div>
                <h3 className="text-lg font-semibold mb-2">积分规则</h3>
                <div className="bg-blue-50 p-4 rounded">
                  <p className="mb-2">
                    <strong>基础积分：</strong> {game.point_reward_rules.base_points}
                  </p>
                  <p className="mb-2">
                    <strong>最小游玩时长：</strong> {game.point_reward_rules.min_duration_seconds} 秒
                  </p>
                  <p className="mb-2">
                    <strong>每分钟积分：</strong> {game.point_reward_rules.points_per_minute}
                  </p>
                  <p>
                    <strong>每次最高积分：</strong> {game.point_reward_rules.max_points_per_session}
                  </p>
                </div>
              </div>

              <Divider />

              {/* 时间信息 */}
              <div className="text-sm text-gray-500">
                <p>创建时间：{new Date(game.created_at).toLocaleString()}</p>
                <p>更新时间：{new Date(game.updated_at).toLocaleString()}</p>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
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

export default AggregatedGameDetailPage;
