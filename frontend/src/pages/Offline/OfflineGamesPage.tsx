/**
 * Offline Games Page Component (User Story 7)
 * T194: Main page for managing offline game downloads
 */

import React, { useEffect, useState } from 'react';
import { Card, Button, Space, Empty, Spin, message, Progress, Tag, Popconfirm, Row, Col } from 'antd';
import { DownloadOutlined, DeleteOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import type { OfflineGame, StorageQuota } from '@/services/api/offline';
import * as offlineApi from '@/services/api/offline';
import StorageQuotaDisplay from '@/components/business/StorageQuotaDisplay';
import OfflineGameCard from '@/components/business/OfflineGameCard';

const OfflineGamesPage: React.FC = () => {
  const [games, setGames] = useState<OfflineGame[]>([]);
  const [storage, setStorage] = useState<StorageQuota | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  // Fetch offline games
  const fetchOfflineGames = async () => {
    setLoading(true);
    try {
      const result = await offlineApi.getOfflineGames();
      setGames(result.games);
      setStorage(result.storage);
    } catch (error) {
      message.error('加载离线游戏失败');
      console.error('Fetch offline games error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfflineGames();
    
    // Auto-refresh every 5 seconds for downloading games
    const interval = setInterval(() => {
      const hasDownloading = games.some(g => g.download_status === 'downloading');
      if (hasDownloading) {
        fetchOfflineGames();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [games]);

  // Handle delete offline game
  const handleDelete = async (gameId: number) => {
    try {
      await offlineApi.deleteOfflineGame(gameId);
      message.success('离线游戏已删除');
      fetchOfflineGames();
    } catch (error) {
      message.error('删除失败');
      console.error('Delete offline game error:', error);
    }
  };

  // Filter games
  const filteredGames = games.filter((game) => {
    if (filter === 'all') return true;
    return game.download_status === filter;
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'downloading':
        return 'processing';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'paused':
        return 'default';
      default:
        return 'default';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'downloading':
        return '下载中';
      case 'pending':
        return '等待中';
      case 'failed':
        return '失败';
      case 'paused':
        return '已暂停';
      default:
        return status;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="offline-games-page min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">离线游戏</h1>
              <p className="text-gray-600">下载游戏到本地，随时随地畅玩</p>
            </div>
            <Button icon={<ReloadOutlined />} onClick={fetchOfflineGames} loading={loading}>
              刷新
            </Button>
          </div>

          {/* Storage Quota Display */}
          {storage && <StorageQuotaDisplay storage={storage} />}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <Space wrap>
            <Button
              type={filter === 'all' ? 'primary' : 'default'}
              onClick={() => setFilter('all')}
            >
              全部 ({games.length})
            </Button>
            <Button
              type={filter === 'completed' ? 'primary' : 'default'}
              onClick={() => setFilter('completed')}
            >
              已完成 ({games.filter(g => g.download_status === 'completed').length})
            </Button>
            <Button
              type={filter === 'downloading' ? 'primary' : 'default'}
              onClick={() => setFilter('downloading')}
            >
              下载中 ({games.filter(g => g.download_status === 'downloading').length})
            </Button>
            <Button
              type={filter === 'pending' ? 'primary' : 'default'}
              onClick={() => setFilter('pending')}
            >
              等待中 ({games.filter(g => g.download_status === 'pending').length})
            </Button>
          </Space>
        </Card>

        {/* Games List */}
        <Spin spinning={loading}>
          {filteredGames.length === 0 ? (
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={filter === 'all' ? '还没有离线游戏' : '没有符合条件的游戏'}
              >
                {filter === 'all' && (
                  <p className="text-gray-500 mt-2">
                    在游戏详情页点击"离线下载"按钮，即可下载游戏到本地
                  </p>
                )}
              </Empty>
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {filteredGames.map((game) => (
                <Col key={game.id} xs={24} sm={12} md={8} lg={6}>
                  <OfflineGameCard game={game} onDelete={handleDelete} onRefresh={fetchOfflineGames} />
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      </div>
    </div>
  );
};

export default OfflineGamesPage;

