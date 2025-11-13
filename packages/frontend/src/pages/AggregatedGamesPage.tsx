/**
 * 聚合游戏列表页面
 * Aggregated Games List Page
 * 
 * 显示从多个平台聚合的游戏列表
 * Displays aggregated games from multiple platforms
 */

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Select, Input, Button, Spin, Empty, Pagination, Space, Tag, Statistic } from 'antd';
import { SearchOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import GameCard from '@/components/business/GameCard';
import { gamesApi } from '@/services/api/games';
import type { Game } from '@/services/api/games';

interface AggregatedGamesPageProps {}

const AggregatedGamesPage: React.FC<AggregatedGamesPageProps> = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSource, setSelectedSource] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);

  // 获取游戏列表
  const fetchGames = async (page: number = 1, source?: string, keyword?: string) => {
    setLoading(true);
    try {
      const response = await gamesApi.getGames({
        page,
        limit: pageSize,
        source,
        search: keyword,
      });

      setGames(response.data || []);
      setTotal(response.pagination?.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch games:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await gamesApi.getStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // 手动同步游戏
  const handleSync = async () => {
    setSyncing(true);
    try {
      await gamesApi.syncGames();
      // 同步完成后刷新列表
      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchGames(1);
      await fetchStats();
    } catch (error) {
      console.error('Failed to sync games:', error);
    } finally {
      setSyncing(false);
    }
  };

  // 搜索游戏
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setCurrentPage(1);
    fetchGames(1, selectedSource, value);
  };

  // 按来源筛选
  const handleSourceChange = (value: string | undefined) => {
    setSelectedSource(value);
    setCurrentPage(1);
    fetchGames(1, value, searchKeyword);
  };

  // 页码变化
  const handlePageChange = (page: number) => {
    fetchGames(page, selectedSource, searchKeyword);
  };

  // 初始化
  useEffect(() => {
    fetchGames();
    fetchStats();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🎮 聚合游戏库</h1>
        <p className="text-gray-600">从 RAWG、Itch.io、IGDB 等平台聚合的游戏</p>
      </div>

      {/* 统计信息 */}
      {stats && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总游戏数"
                value={stats.totalGames || 0}
                prefix="🎯"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="RAWG 游戏"
                value={stats.sourceStats?.rawg || 0}
                prefix="📚"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Itch.io 游戏"
                value={stats.sourceStats?.itch || 0}
                prefix="🎨"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="IGDB 游戏"
                value={stats.sourceStats?.igdb || 0}
                prefix="🌟"
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 筛选和搜索 */}
      <Card className="mb-6">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div className="flex flex-wrap gap-4">
            {/* 搜索框 */}
            <Input.Search
              placeholder="搜索游戏名称..."
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              style={{ width: 300 }}
              allowClear
            />

            {/* 来源筛选 */}
            <Select
              placeholder="按来源筛选"
              style={{ width: 200 }}
              allowClear
              onChange={handleSourceChange}
              options={[
                { label: '🌐 RAWG', value: 'rawg' },
                { label: '🎨 Itch.io', value: 'itch' },
                { label: '🌟 IGDB', value: 'igdb' },
              ]}
            />

            {/* 同步按钮 */}
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              loading={syncing}
              onClick={handleSync}
            >
              {syncing ? '同步中...' : '手动同步'}
            </Button>
          </div>

          {/* 当前筛选条件 */}
          {(searchKeyword || selectedSource) && (
            <div className="flex items-center gap-2">
              <FilterOutlined />
              <span className="text-gray-600">筛选条件：</span>
              {searchKeyword && (
                <Tag
                  closable
                  onClose={() => handleSearch('')}
                >
                  搜索: {searchKeyword}
                </Tag>
              )}
              {selectedSource && (
                <Tag
                  closable
                  onClose={() => handleSourceChange(undefined)}
                >
                  来源: {selectedSource}
                </Tag>
              )}
            </div>
          )}
        </Space>
      </Card>

      {/* 游戏列表 */}
      <Spin spinning={loading} tip="加载中...">
        {games.length > 0 ? (
          <>
            <Row gutter={[16, 16]} className="mb-6">
              {games.map((game) => (
                <Col key={game.id} xs={24} sm={12} md={8} lg={6}>
                  <GameCard game={game} />
                </Col>
              ))}
            </Row>

            {/* 分页 */}
            <div className="flex justify-center">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                onChange={handlePageChange}
                showSizeChanger
                showQuickJumper
                showTotal={(total) => `共 ${total} 款游戏`}
              />
            </div>
          </>
        ) : (
          <Empty
            description={
              searchKeyword || selectedSource
                ? '未找到匹配的游戏'
                : '暂无游戏数据，请点击"手动同步"按钮开始聚合游戏'
            }
            style={{ marginTop: 50, marginBottom: 50 }}
          />
        )}
      </Spin>

      {/* 信息提示 */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <p className="text-sm text-gray-700">
          💡 <strong>提示：</strong>
          系统会每天凌晨 2 点自动同步游戏数据。你也可以点击"手动同步"按钮立即更新游戏列表。
        </p>
      </Card>
    </div>
  );
};

export default AggregatedGamesPage;
