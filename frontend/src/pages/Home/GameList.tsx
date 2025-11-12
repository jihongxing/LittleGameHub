/**
 * GameList Page
 * Main page for browsing game catalog
 * T053: Create GameList page component
 * T056: Implement game search functionality
 * T057: Implement infinite scroll or pagination
 * T059: Add game category filtering
 */

import React, { useState, useEffect } from 'react';
import { Input, Select, Pagination, Spin, Alert, Row, Col, Space, Button, Divider } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import GameCard from '@/components/business/GameCard';
import Recommendations from '@/components/business/Recommendations';
import Loading from '@/components/common/Loading';
import { getGames, type Game, type PaginatedGamesResponse } from '@/services/api/games';

const { Search } = Input;
const { Option } = Select;

/**
 * Available categories for filtering
 */
const CATEGORIES = [
  { value: 'all', label: '全部' },
  { value: 'puzzle', label: '益智' },
  { value: 'action', label: '动作' },
  { value: 'casual', label: '休闲' },
  { value: 'arcade', label: '街机' },
  { value: 'strategy', label: '策略' },
  { value: 'sports', label: '体育' },
  { value: 'adventure', label: '冒险' },
  { value: 'simulation', label: '模拟' },
];

/**
 * Sort options
 */
const SORT_OPTIONS = [
  { value: 'popular', label: '最热门' },
  { value: 'latest', label: '最新' },
  { value: 'rating', label: '最高评分' },
];

/**
 * GameList Page Component
 */
const GameList: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and pagination state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [category, setCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'latest' | 'rating'>('popular');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);

  /**
   * Fetch games with current filters
   */
  const fetchGames = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: PaginatedGamesResponse = await getGames({
        search: searchQuery || undefined,
        category: category !== 'all' ? category : undefined,
        sort: sortBy,
        page: currentPage,
        limit: pageSize,
        status: 'active',
      });

      setGames(response.games);
      setTotal(response.pagination.total);
    } catch (err: any) {
      console.error('Failed to fetch games:', err);
      setError(err.message || '加载游戏失败，请稍后重试');
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch games when filters change
  useEffect(() => {
    fetchGames();
  }, [searchQuery, category, sortBy, currentPage, pageSize]);

  /**
   * Handle search
   */
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page
  };

  /**
   * Handle category filter change
   */
  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setCurrentPage(1);
  };

  /**
   * Handle sort change
   */
  const handleSortChange = (value: 'popular' | 'latest' | 'rating') => {
    setSortBy(value);
    setCurrentPage(1);
  };

  /**
   * Handle pagination change
   */
  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) {
      setPageSize(pageSize);
    }
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setSearchQuery('');
    setCategory('all');
    setSortBy('popular');
    setCurrentPage(1);
  };

  return (
    <div className="game-list-page min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">游戏中心</h1>
          <p className="text-gray-600">发现并畅玩精彩小游戏</p>
        </div>

        {/* T148: Personalized Recommendations */}
        <div className="mb-8">
          <Recommendations 
            limit={6} 
            excludeGameIds={games.map(g => g.id)}
            showScenarioSelector={true}
          />
        </div>

        <Divider />

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <Space direction="vertical" size="middle" className="w-full">
            {/* Search Bar */}
            <Search
              placeholder="搜索游戏名称或描述..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              defaultValue={searchQuery}
              data-testid="search-input"
            />

            {/* Filter Row */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <FilterOutlined />
                <span className="text-sm font-medium">分类:</span>
                <Select
                  value={category}
                  onChange={handleCategoryChange}
                  style={{ width: 150 }}
                  data-testid="category-filter"
                >
                  {CATEGORIES.map((cat) => (
                    <Option key={cat.value} value={cat.value} data-testid={`category-filter-${cat.value}`}>
                      {cat.label}
                    </Option>
                  ))}
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" aria-label="sort by">排序:</span>
                <Select
                  value={sortBy}
                  onChange={handleSortChange}
                  style={{ width: 150 }}
                  data-testid="sort-select"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </div>

              {(searchQuery || category !== 'all' || sortBy !== 'popular') && (
                <Button onClick={handleClearFilters} size="small">
                  清除筛选
                </Button>
              )}
            </div>

            {/* Result Count */}
            <div className="text-sm text-gray-600">
              找到 <span className="font-semibold">{total}</span> 个游戏
            </div>
          </Space>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20" data-testid="loading-spinner">
            <Loading message="加载游戏中..." />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert
            message="加载失败"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            className="mb-6"
            data-testid="error-message"
          />
        )}

        {/* Empty State */}
        {!loading && !error && games.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg text-gray-500 mb-4">未找到游戏</p>
            <Button onClick={handleClearFilters}>清除筛选</Button>
          </div>
        )}

        {/* Game Grid */}
        {!loading && !error && games.length > 0 && (
          <>
            <Row gutter={[16, 16]} className="mb-8">
              {games.map((game) => (
                <Col
                  key={game.id}
                  xs={24}
                  sm={12}
                  md={8}
                  lg={6}
                  xl={6}
                >
                  <GameCard game={game} />
                </Col>
              ))}
            </Row>

            {/* Pagination */}
            <div className="flex justify-center" data-testid="pagination">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                onChange={handlePageChange}
                onShowSizeChange={handlePageChange}
                showSizeChanger
                showQuickJumper
                showTotal={(total) => `共 ${total} 个游戏`}
                pageSizeOptions={['12', '20', '40', '60']}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GameList;
