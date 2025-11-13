/**
 * Collection Manager Component (User Story 7)
 * T197: Component for managing games in a collection
 */

import React, { useEffect, useState } from 'react';
import { Modal, List, Button, message, Empty, Spin } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import * as collectionsApi from '@/services/api/collections';
import type { CollectionItem } from '@/services/api/collections';

interface CollectionManagerProps {
  collectionId: number;
  visible?: boolean;
  onClose?: () => void;
}

const CollectionManager: React.FC<CollectionManagerProps> = ({
  collectionId,
  visible = false,
  onClose,
}) => {
  const [games, setGames] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch collection games
  const fetchGames = async () => {
    setLoading(true);
    try {
      const result = await collectionsApi.getCollectionGames(collectionId);
      setGames(result.games);
    } catch (error) {
      message.error('加载游戏失败');
      console.error('Fetch collection games error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && collectionId) {
      fetchGames();
    }
  }, [visible, collectionId]);

  // Handle remove game
  const handleRemove = async (gameId: number) => {
    try {
      await collectionsApi.removeGameFromCollection(collectionId, gameId);
      message.success('已从收藏夹移除');
      fetchGames();
    } catch (error) {
      message.error('移除失败');
      console.error('Remove game error:', error);
    }
  };

  return (
    <Modal
      title="管理收藏夹"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
      width={600}
    >
      <Spin spinning={loading}>
        <List
          dataSource={games}
          locale={{
            emptyText: <Empty description="收藏夹为空" />,
          }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemove(item.game_id)}
                >
                  移除
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={`游戏 ID: ${item.game_id}`}
                description={item.note || '无备注'}
              />
              <div className="text-gray-500 text-sm">
                添加于 {new Date(item.added_at).toLocaleDateString('zh-CN')}
              </div>
            </List.Item>
          )}
        />
      </Spin>
    </Modal>
  );
};

export default CollectionManager;

