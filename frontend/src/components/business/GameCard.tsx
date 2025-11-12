/**
 * GameCard Component
 * Displays a game card in the catalog
 * T052: Create GameCard component
 */

import React from 'react';
import { Card, Tag, Rate } from 'antd';
import { PlayCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Game } from '@/services/api/games';

const { Meta } = Card;

interface GameCardProps {
  game: Game;
}

/**
 * Game Card Component
 * Displays game information in a card layout
 */
const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/games/${game.id}`);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/games/${game.id}/play`);
  };

  return (
    <Card
      hoverable
      cover={
        <div className="relative h-48 overflow-hidden">
          <img
            alt={game.title}
            src={game.cover_image_url}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {game.is_featured && (
            <div className="absolute top-2 right-2">
              <Tag color="gold">精选</Tag>
            </div>
          )}
          <div
            className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer"
            onClick={handlePlayClick}
          >
            <PlayCircleOutlined
              style={{ fontSize: 64, color: 'white' }}
              data-testid="play-icon"
            />
          </div>
        </div>
      }
      onClick={handleClick}
      data-testid="game-card"
      data-game-id={game.id}
      className="game-card"
    >
      <Meta
        title={
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold truncate">{game.title}</span>
          </div>
        }
        description={
          <div className="space-y-2">
            <p className="text-sm text-gray-600 line-clamp-2">{game.description}</p>

            {/* Category Tags */}
            <div className="flex flex-wrap gap-1" data-testid="game-category-tags">
              {game.category_tags.slice(0, 3).map((tag) => (
                <Tag key={tag} data-testid="game-category-tag">
                  {tag}
                </Tag>
              ))}
            </div>

            {/* Rating and Play Count */}
            <div className="flex items-center justify-between text-sm">
              {game.average_rating !== null ? (
                <div className="flex items-center gap-1" data-testid="game-rating">
                  <Rate disabled defaultValue={game.average_rating} count={5} className="text-xs" />
                  <span className="text-gray-600">{game.average_rating.toFixed(1)}</span>
                </div>
              ) : (
                <span className="text-gray-400">暂无评分</span>
              )}

              <div className="flex items-center gap-1 text-gray-600" data-testid="game-play-count">
                <UserOutlined />
                <span>{formatPlayCount(game.play_count)} 次游玩</span>
              </div>
            </div>

            {/* Point Reward Info */}
            <div className="text-xs text-blue-600 mt-2">
              <span>
                最高可获得 {game.point_reward_rules.max_points_per_session} 积分
              </span>
            </div>

            {/* Availability Status */}
            {game.availability_status !== 'active' && (
              <div className="mt-2">
                {game.availability_status === 'maintenance' && (
                  <Tag color="orange">维护中</Tag>
                )}
                {game.availability_status === 'inactive' && (
                  <Tag color="red">暂不可用</Tag>
                )}
              </div>
            )}
          </div>
        }
      />
    </Card>
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

export default GameCard;
