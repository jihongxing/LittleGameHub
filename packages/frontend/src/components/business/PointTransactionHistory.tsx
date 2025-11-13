/**
 * Point Transaction History Component
 * Displays user's point transaction history
 * T087: Create PointTransactionHistory component
 */

import React, { useState, useEffect } from 'react';
import { List, Tag, Space, Pagination, Radio, Empty, Descriptions } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { getPointTransactions, type PointTransaction } from '@/services/api/points';

/**
 * Point Transaction History Component
 */
const PointTransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<'all' | 'earn' | 'spend'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const pageSize = 20;

  /**
   * Fetch transactions
   */
  const fetchTransactions = async (type?: 'earn' | 'spend', page: number = 1) => {
    try {
      setLoading(true);
      const data = await getPointTransactions({
        type,
        page,
        limit: pageSize,
      });
      setTransactions(data?.transactions || []);
      setTotal(data?.pagination?.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
      setTransactions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(
      filterType === 'all' ? undefined : filterType,
      currentPage
    );
  }, [filterType, currentPage]);

  /**
   * Handle filter change
   */
  const handleFilterChange = (e: any) => {
    setFilterType(e.target.value);
    setCurrentPage(1);
  };

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    return date.toLocaleDateString('zh-CN');
  };

  /**
   * Get source text
   */
  const getSourceText = (source: string): string => {
    const sourceMap: Record<string, string> = {
      game_play: '游戏奖励',
      task_daily_checkin: '每日签到',
      task_watch_ad: '观看广告',
      task_invite_friend: '邀请好友',
      redemption: '积分兑换',
      refund: '退款',
      admin: '系统调整',
    };
    return sourceMap[source] || source;
  };

  return (
    <div className="point-transaction-history">
      {/* Filter */}
      <div className="mb-4 flex items-center justify-between">
        <Radio.Group value={filterType} onChange={handleFilterChange} buttonStyle="solid">
          <Radio.Button value="all">全部</Radio.Button>
          <Radio.Button value="earn" data-testid="filter-earn">
            收入
          </Radio.Button>
          <Radio.Button value="spend" data-testid="filter-spend">
            支出
          </Radio.Button>
        </Radio.Group>

        <div className="text-sm text-gray-500">
          共 {total} 条记录
        </div>
      </div>

      {/* Transaction List */}
      <List
        loading={loading}
        dataSource={transactions}
        locale={{
          emptyText: (
            <Empty
              description="暂无交易记录"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
        renderItem={(transaction) => {
          const isEarn = transaction.type === 'earn';

          return (
            <List.Item
              className="hover:bg-gray-50 px-4 rounded-lg transition-colors"
              data-testid="transaction-item"
              data-transaction-id={transaction.id}
            >
              <div className="flex items-center justify-between w-full">
                {/* Left: Icon and Details */}
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isEarn ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    {isEarn ? (
                      <ArrowUpOutlined className="text-green-600 text-lg" />
                    ) : (
                      <ArrowDownOutlined className="text-red-600 text-lg" />
                    )}
                  </div>

                  {/* Details */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium" data-testid="transaction-type">
                        {getSourceText(transaction.source)}
                      </span>
                      <Tag color={isEarn ? 'success' : 'error'}>
                        {isEarn ? '收入' : '支出'}
                      </Tag>
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.description}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      <ClockCircleOutlined className="mr-1" />
                      {formatDate(transaction.created_at)}
                    </div>
                  </div>
                </div>

                {/* Right: Amount and Balance */}
                <div className="text-right">
                  <div
                    className={`text-lg font-bold ${
                      isEarn ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {isEarn ? '+' : ''}
                    {transaction.amount}
                  </div>
                  <div className="text-sm text-gray-500">
                    余额：{transaction.balance_after}
                  </div>
                </div>
              </div>
            </List.Item>
          );
        }}
      />

      {/* Pagination */}
      {total > pageSize && (
        <div className="mt-6 flex justify-center" data-testid="pagination">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total) => `共 ${total} 条`}
            data-testid="pagination-next"
          />
        </div>
      )}
    </div>
  );
};

export default PointTransactionHistory;

