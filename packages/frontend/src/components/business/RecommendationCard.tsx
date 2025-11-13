/**
 * Recommendation Card Component
 * Displays a single game recommendation with reason
 * T147: Create RecommendationCard component
 * T150: Display recommendation reason
 */

import React from 'react';
import { Card, Tag, Rate, Button } from 'antd';
import { PlayCircleOutlined, StarFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Recommendation } from '@/services/api/recommendations';
import type { Game } from '@/services/api/games';

interface RecommendationCardProps {
  recommendation: Recommendation;
  game: Game;
  onPlay?: (gameId: string) => void;
}

/**
 * Recommendation Card Component
 */
const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  game,
  onPlay,
}) => {
  const navigate = useNavigate();

  const handlePlayClick = () => {
    if (onPlay) {
      onPlay(game.id);
    }
    navigate(`/games/${game.id}`);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      popular: 'red',
      similar: 'blue',
      personalized: 'purple',
      scenario: 'green',
      trending: 'orange',
    };
    return colors[type] || 'default';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      popular: '热门',
      similar: '相似',
      personalized: '个性化',
      scenario: '场景推荐',
      trending: '趋势',
    };
    return labels[type] || type;
  };

  return (
    <Card
      hoverable
      className="recommendation-card"
      data-testid="recommendation-card"
      cover={
        <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
          <PlayCircleOutlined style={{ fontSize: 64, color: 'white', opacity: 0.8 }} />
          {/* Type Badge */}
          <Tag
            color={getTypeColor(recommendation.type)}
            className="absolute top-2 left-2"
            data-testid="recommendation-type"
          >
            {getTypeLabel(recommendation.type)}
          </Tag>
          {/* Score Badge */}
          <div className="absolute top-2 right-2 bg-white rounded-full px-3 py-1">
            <span className="text-sm font-bold text-orange-500">
              {Math.round(recommendation.score)}分
            </span>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Game Title */}
        <h3
          className="text-lg font-semibold mb-0 line-clamp-1"
          data-testid="game-title"
        >
          {game.title}
        </h3>

        {/* Recommendation Reason (T150) */}
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded">
          <StarFilled />
          <span data-testid="recommendation-reason">{recommendation.reason}</span>
        </div>

        {/* Game Rating */}
        <div className="flex items-center justify-between">
          <Rate
            disabled
            allowHalf
            value={game.average_rating || 0}
            className="text-sm"
          />
          <span className="text-sm text-gray-500">
            {game.play_count} 次游玩
          </span>
        </div>

        {/* Categories */}
        {game.category_tags && game.category_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {game.category_tags.slice(0, 3).map((tag, index) => (
              <Tag key={index} className="text-xs">
                {tag}
              </Tag>
            ))}
          </div>
        )}

        {/* Play Button */}
        <Button
          type="primary"
          block
          size="large"
          icon={<PlayCircleOutlined />}
          onClick={handlePlayClick}
          data-testid="play-button"
        >
          立即游玩
        </Button>
      </div>
    </Card>
  );
};

export default RecommendationCard;

