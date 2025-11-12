/**
 * Recommendations Component
 * Displays personalized game recommendations
 * T146: Create Recommendations component
 */

import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Empty, Alert } from 'antd';
import { StarOutlined } from '@ant-design/icons';
import RecommendationCard from './RecommendationCard';
import ScenarioSelector from './ScenarioSelector';
import {
  getRecommendations,
  trackRecommendationPlay,
  type Recommendation,
} from '@/services/api/recommendations';
import { getGameById, type Game } from '@/services/api/games';

interface RecommendationsProps {
  userId?: string;
  limit?: number;
  excludeGameIds?: string[];
  showScenarioSelector?: boolean;
}

/**
 * Recommendations Component
 */
const Recommendations: React.FC<RecommendationsProps> = ({
  limit = 6,
  excludeGameIds = [],
  showScenarioSelector = true,
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [games, setGames] = useState<Map<string, Game>>(new Map());
  const [scenario, setScenario] = useState<string>('any');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [scenario]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get recommendations
      const data = await getRecommendations({
        limit,
        scenario: scenario !== 'any' ? scenario : undefined,
        exclude: excludeGameIds,
      });

      setRecommendations(data.recommendations);

      // Fetch game details
      const gamePromises = data.recommendations.map((rec) =>
        getGameById(rec.game_id)
      );
      const gamesData = await Promise.all(gamePromises);

      const gamesMap = new Map<string, Game>();
      gamesData.forEach((game) => {
        gamesMap.set(game.id, game);
      });
      setGames(gamesMap);
    } catch (err: any) {
      console.error('Failed to fetch recommendations:', err);
      setError(err.message || '加载推荐失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (gameId: string) => {
    try {
      await trackRecommendationPlay(gameId);
    } catch (err) {
      console.error('Failed to track play:', err);
    }
  };

  if (loading && recommendations.length === 0) {
    return (
      <div className="text-center py-12" data-testid="loading-spinner">
        <Spin size="large" />
        <p className="mt-4 text-gray-600">加载个性化推荐中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="加载失败"
        description={error}
        type="error"
        showIcon
        data-testid="error-message"
      />
    );
  }

  if (recommendations.length === 0) {
    return (
      <Empty
        description="暂无推荐内容"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        data-testid="empty-state"
      />
    );
  }

  return (
    <div className="recommendations" data-testid="recommendations">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <StarOutlined style={{ fontSize: 24, color: '#faad14' }} />
          <h2 className="text-2xl font-bold mb-0">为您推荐</h2>
        </div>

        {/* Scenario Selector */}
        {showScenarioSelector && (
          <ScenarioSelector value={scenario} onChange={setScenario} />
        )}
      </div>

      {/* Recommendation Grid */}
      <Row gutter={[16, 16]}>
        {recommendations.map((recommendation) => {
          const game = games.get(recommendation.game_id);
          if (!game) return null;

          return (
            <Col key={recommendation.game_id} xs={24} sm={12} md={8} lg={6}>
              <RecommendationCard
                recommendation={recommendation}
                game={game}
                onPlay={handlePlay}
              />
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default Recommendations;

